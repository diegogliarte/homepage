import { formatApiCall } from "utils/proxy/api-helpers";
import { httpProxy } from "utils/proxy/http";
import getServiceWidget from "utils/config/service-helpers";
import createLogger from "utils/logger";
import widgets from "../widgets";

const MYINVESTOR_AUTH_URL = "https://app.myinvestor.es/ms-keycloak/api/v1/auth/token";

const logger = createLogger("myinvestorProxyHandler");

async function login(widget) {
  logger.debug("MyInvestor is rejecting the request, logging in.");
  const loginUrl = new URL(MYINVESTOR_AUTH_URL).toString();
  const loginBody = JSON.stringify({ customerId: widget.username, password: widget.password })
  const loginParams = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: loginBody,
  };

  // eslint-disable-next-line no-unused-vars
  const [status, , data] = await httpProxy(loginUrl, loginParams);

  return [status, data];
}

export default async function myinvestorProxyHandler(req, res) {
  const { group, service, endpoint, index } = req.query;

  if (!group || !service) {
    logger.debug("Invalid or missing service '%s' or group '%s'", service, group);
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  const widget = await getServiceWidget(group, service, index);

  if (!widget) {
    logger.debug("Invalid or missing widget for service '%s' in group '%s'", service, group);
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  const url = new URL(formatApiCall(widgets[widget.type].api, { endpoint, ...widget }));
  const params = { method: "GET", headers: {} };

  let [status, contentType, data] = await httpProxy(url, params);
  if (status === 403) {
    [status, data] = await login(widget);

    if (status !== 200) {
      logger.error("HTTP %d logging in to MyInvestor.  Data: %s", status, data);
      return res.status(status).end(data);
    }

    const parsedData = JSON.parse(data.toString());
    const accessToken = parsedData.payload?.data?.accessToken

    if (parsedData.status?.code !== "OK") {
      logger.error("Error logging in to MyInvestor: Data: %s", data);
      return res.status(401).end(data);
    }

    params.headers["Authorization"] = `Bearer ${accessToken}`;

    [status, contentType, data] = await httpProxy(url, params);
  }

  if (status !== 200) {
    logger.error("HTTP %d getting data from MyInvestor.  Data: %s", status, data);
  }

  return res.status(status).send(data);
}
