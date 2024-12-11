import {useTranslation} from "next-i18next";
import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";
import {useEffect, useState} from "react";
import {createPortal} from "react-dom";

export default function Component({service}) {
  const {t} = useTranslation();
  const {widget} = service;
  const {data, error} = useWidgetAPI(widget, "resume");
  const [targetElement, setTargetElement] = useState(null);

  useEffect(() => {
    const container = document.querySelector('.bookmark[data-name="MyInvestor"]');
    if (container) {
      const bookmarkText = container.querySelector('.bookmark-text');
      if (bookmarkText) {
        setTargetElement(bookmarkText.parentElement.parentElement);

        // Modify the class of bookmark-icon
        const bookmarkIcon = container.querySelector('.bookmark-icon');
        if (bookmarkIcon) {
          bookmarkIcon.classList.add("rounded-bl-none");
        }
      }
    }
  }, []);

  if (!targetElement) {
    return null; // Render nothing until target element is available
  }

  if (error) {
    return createPortal(
      <Container service={service} error={error}/>,
      targetElement
    );
  }

  if (!data) {
    return createPortal(
      <Container service={service}>
        <Block label="myinvestor.loading"/>
      </Container>,
      targetElement
    );
  }

  const inversionesDtoList =
    data?.cuentasValores[0]?.inversionesCuentaValores?.FONDOS_INDEXADOS?.inversionesDtoList || [];

  const getColorClass = (value) => {
    return value >= 0 ? "text-green-500" : "text-red-500";
  };

  const twoDecimals = (value) => {
    return Number(Number.parseFloat(value).toFixed(2)).toLocaleString("es-ES");
  };

  return createPortal(
    <div className="w-full mt-2">
      <Container service={service}>
        <div className="flex flex-col w-full p-2">
          {inversionesDtoList.map((inversion, index) => (
            <div key={index} className="flex flex-row justify-between text-xs py-1">
              <div className="flex-1 text-left">
                <span>{twoDecimals(inversion.importeInicial)}{inversion.divisaValorLiquidativo}</span>
              </div>
              <div className="flex-1 text-left">
              <span className={getColorClass(inversion.beneficio)}>
                {twoDecimals(inversion.beneficio)}{inversion.divisaValorLiquidativo} ({twoDecimals(inversion.rentabilidadTotal)}%)
              </span>
              </div>
            </div>
          ))}
          <div className="flex flex-row justify-between text-xs mt-1 py-2 border-t-2 ">
            <div className="flex-1 text-left">
              <span>{twoDecimals(data?.cuentasValores[0].totalInvertido)}€</span>
            </div>
            <div className="flex-1 text-left">
            <span className={getColorClass(data?.cuentasValores[0].beneficio)}>
              {twoDecimals(data?.cuentasValores[0].beneficio)}€ ({twoDecimals(data?.cuentasValores[0].rentabilidadTotal)}%)
            </span>
            </div>
          </div>
        </div>
      </Container>
    </div>,
    targetElement
  );
}
