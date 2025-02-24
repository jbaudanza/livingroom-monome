
require("dotenv").config();

const { XMLParser } = require("fast-xml-parser");

type ArrivalInformation = {
  type: "soon" | "unknown" | "error",
} | { type: "time", minutes: number, seconds: number }

export async function getNextBus(): Promise<ArrivalInformation> {
  const serviceKey = process.env.BUS_API_SERVICE_KEY;
  const arsId = process.env.BUS_API_STATION_ARS_ID;

  if (!serviceKey || !arsId) {
    throw new Error("BUS_API_SERVICE_KEY or BUS_API_STATION_ARS_ID is not set");
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
  console.log(list.map((item: any) => item.arrmsg1));

  // XXX Should we search by arsId 4236?
  const item = list.find((item: any) => item.busRouteAbrv === 2016);

  if (!item) {
    console.log("Route not found");
    return { type: "error" };
  }

  const arrmsg1 = item.arrmsg1;

  if (typeof arrmsg1 !== "string") {
    throw new Error("arrmsg1 is not a string");
  }

  if (arrmsg1 == "운행종료" || arrmsg1 == "출발대기") {
    return { type: "unknown" };
  }

  if (arrmsg1 == "곧 도착") {
    return { type: "soon" };
  }

  const match = item.arrmsg1.match(/(\d+)분(\d+)초/);
  if (match) {
    return { type: "time", minutes: parseInt(match[1]), seconds: parseInt(match[2]) };
  } else {
    throw new Error("Can't parse string from: " + arrmsg1);
  }
}

getNextBus().then(console.log);
