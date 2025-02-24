
const { XMLParser } = require("fast-xml-parser");

export async function getNextBus(): Promise<number> {
  const serviceKey = process.env.BUS_API_SERVICE_KEY;
  const arsId = process.env.BUS_API_STATION_ARS_ID;
  const busRouteAbrv = process.env.BUS_ROUTE_ABRV;

  if (!serviceKey) {
    throw new Error("BUS_API_SERVICE_KEY is not set");
  }

  if (!arsId) {
    throw new Error("BUS_API_STATION_ARS_ID is not set");
  }

  if (!busRouteAbrv) {
    throw new Error("BUS_ROUTE_ABRV is not set");
  }

  const qs = new URLSearchParams({
    serviceKey,
    arsId,
  });

  const r = await fetch(`http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?${qs.toString()}`)
  const data = await r.text();

  const parser = new XMLParser();
  const xml = parser.parse(data);

  const list = xml.ServiceResult.msgBody.itemList;

  const item = list.find((item: any) => String(item.busRouteAbrv) === String(busRouteAbrv));

  if (!item) {
    throw new Error("Route not found: " + busRouteAbrv);
  }

  const traTime1 = item.traTime1;

  if (traTime1 == null) {
    throw new Error("traTime1 is missing");
  }

  return traTime1;
}
