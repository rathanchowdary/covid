const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running");
    });
  } catch (error) {
    console.log(`Error ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

let convertStatesListObj = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

let convertDistrictObj = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

app.get("/states/", async (request, response) => {
  let statesListQuery = `
    SELECT * FROM state;`;

  let statesListArray = await db.all(statesListQuery);
  let convertStatesList = statesListArray.map((each) => {
    convertStatesListObj(each);
  });
  response.send(convertStatesList);
});

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let stateIdQuery = `
  SELECT * FROM state WHERE state_id = ${stateId};`;

  let stateIdArray = await db.get(stateIdQuery);
  response.send(
    stateIdArray.map((each) => {
      convertStatesListObj(each);
    })
  );
});

app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;

  let districtsPostQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    Values('${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths},
    );`;

  await db.run(districtsPostQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let districtIdQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  let districtIdArray = await db.get(districtIdQuery);
  response.send(convertDistrictObj(districtIdArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let districtDeleteQuery = `
    DELETE FROM district WHERE district_id = ${districtId};
      `;

  await db.run(districtDeleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let districtUpdateQuery = `
  UPDATE district SET
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};
  `;

  await db.run(districtUpdateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let statsQuery = `
  SELECT SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  FROM state where state_id = ${stateId};`;
});

let statsArray = await db.get(statsQuery);
response.send({
  totalCases: stats["SUM(cases)"],
  totalCured: stats["SUM(cured)"],
  totalActive: stats["SUM(active)"],
  totalDeaths: stats["SUM(deaths)"],
});

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let districtDetailsQuery = `
  SELECT state_name FROM district NATURAL JOIN state WHERE district_id = ${districtId}`;

  let districtDetailsArray = await db.get(districtDetailsArray);
  response.send({ stateName: districtDetailsArray.state_name });
});

module.exports = app;
