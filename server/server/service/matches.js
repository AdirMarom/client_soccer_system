var express = require("express");
var router = express.Router();
const DButils = require("../domain/routes/DButils");
const players_utils = require("../domain/routes/players_utils");
const matches_utils = require("../domain/routes/matches_utils");
const league_utils = require("../domain/routes/league_utils");
const users_access = require("../data/userAccess");
const users_utils = require("../domain/routes/users_utils");



router.get("/favoriteFutureMatches", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    console.log(req.session.user_id);
    const match_ids = await users_utils.getFavoriteMatches(user_id);
    matchs_array = [];
    for (let i = 0; i < match_ids.length; i++) {
      id = match_ids[i].match_id;
      const match = await matches_utils.getMatchById(id);
      console.log(match);
      if (match) {
        for (let j = 0; j < match.length; j++) {
          matchs_array.push(match[j]);
        }
      }
    }
    console.log(matchs_array)
    let result = []
    const futureMatches = await matches_utils.getAllFutureGames();
    console.log(futureMatches)
    matchs_array.map((match1) => {
      futureMatches.map((match2) => {
        console.log(match1);
        if (match1.ID == match2.ID) {
          result.push(match1);
        }
      })
    })
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

function compareDates(d1, d2) {
  //  d1 > d2 false
  var parts_d1 = d1.split('/');
  var d1 = Number(parts_d1[2] + parts_d1[1] + parts_d1[0]);
  parts_d2 = d2.split('/');
  var d2 = Number(parts_d2[2] + parts_d2[1] + parts_d2[0]);
  //month
  if (parts_d1[0] < 0 || parts_d1[0] > 12 || parts_d2[0] < 0 || parts_d2[0] > 12)
    return false;
  //day
  if (parts_d1[1] < 0 || parts_d1[1] > 31 || parts_d2[1] < 0 || parts_d2[1] > 31)
    return false;
  //year
  if (parts_d1[2] < 0 || parts_d2[20] < 0)
    return false;
  return d1 <= d2;
}




//middlewhere for add future games
router.use("/addFutureGame", async function (req, res, next) {

  // parameters exists
  // valid parameters

  const date = req.body.date;
  const time = req.body.time;
  const homeTeam = req.body.homeTeam;
  const awayTeam = req.body.awayTeam;
  const referee = req.body.referee;
  const stadium = req.body.stadium;

  if (!date || !time || !homeTeam || !awayTeam || !referee || !stadium) {
    res.status(400).send("all parameters are requird! ");
    return;
  }

  if (await users_utils.isUserAdmin(req.session.user_id) != true) {
    res.status(401).send("user not have permission ");
    return;
  }

  //check if is future game
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  today = mm + '/' + dd + '/' + yyyy;

  let result = compareDates(date, today)



  if (result) {
    res.status(400).send(" invalid date ");
    return;
  }

  const Hteam = await league_utils.getTeamByName(homeTeam); // check if Home team exist
  const Ateam = await league_utils.getTeamByName(awayTeam); // check if Away team exist

  if (!Hteam || !Ateam) {
    res.status(400).send(" invalid teams names ");
    return
  }

  const all_users = await users_access.getUserNames();

  try {

    if (!(all_users.find((x) => x.username === referee))) {
      res.status(400).send("invalid referee name");
      return;
    }
  }

  catch (error) {
    next(error);
  }

  next();

});


router.post("/addFutureGame", async (req, res, next) => {

  try {
    const gameDetails = req.body;
    bool = await matches_utils.addFutureGame(gameDetails);
    res.status(201).send("game added successfully");

  } catch (error) {
    next(error);
  }
});


router.use("/addPastGame", async function (req, res, next) {

  // parameters exists
  // valid parameters

  const date = req.body.date;
  const time = req.body.time;
  const homeTeam = req.body.homeTeam;
  const awayTeam = req.body.awayTeam;
  const referee = req.body.referee;
  const stadium = req.body.stadium;
  const scoreHome = req.body.scoreHome;
  const scoreAway = req.body.scoreAway;
  const events = req.body.events;

  if (!date || !time || !homeTeam || !awayTeam || !referee || !stadium || !scoreHome || !scoreAway || !events) {
    res.status(400).send("all parameters are requird! ");
    return;
  }

  if (await users_utils.isUserAdmin(req.session.user_id) != true) {
    res.status(401).send("user not have permission ");
    return;
  }

  //check if is future game
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  today = mm + '/' + dd + '/' + yyyy;
  let result = compareDates(date, today)

  if (!result) {
    res.status(400).send(" invalid date ");
    return;
  }

  const Hteam = await league_utils.getTeamByName(homeTeam); // check if Home team exist
  const Ateam = await league_utils.getTeamByName(awayTeam); // check if Away team exist

  if (!Hteam || !Ateam) {
    res.status(400).send(" invalid teams names ");
    return;
  }


  const all_users = await users_access.getUserNames();


  try {
    if (!(all_users.find((x) => x.username === referee)))
      res.status(400).send("invalid referee name");
    return;
  }

  catch (error) {
    next(error);
  }

  next();

});



router.post("/addPastGame", async (req, res, next) => {
  try {
    const gameDetails = req.body;
    bool = await matches_utils.addPastGame(gameDetails);
    res.status(200).send("game added successfully");

  } catch (error) {
    next(error);
  }
});




router.get("/pastSeasonGames/:teamName", async (req, res, next) => {

  try {
    const teamName = req.params.teamName;
    const matches = await matches_utils.getPastGames();
    console.log(matches);
    past_game=[];
    for(let i=0 ; i<matches.length ;i++){
      if(matches[i].homeTeam==teamName ||matches[i].awayTeam==teamName)
        past_game.push(matches[i]);
    }
    console.log(past_game);
    if (!teamName || teamName === ":") {
      res.status(400).send("no arguments given");
    }
    else
      res.status(200).send(past_game);

  } catch (error) {
    next(error);
  }

});



router.put("/updateScore", async (req, res, next) => {
  try {
    const match_id = req.body.match_id;
    const homeScore = req.body.homeScore;
    const awayScore = req.body.awayScore;

    await matches_utils.updateScore(match_id, homeScore, awayScore);
    res.status(200).send("updated");

  } catch (error) {
    next(error);
  }
});


router.put("/updateEvents", async (req, res, next) => {
  try {
    const match_id = req.body.match_id;
    const events = req.body.events;

    await matches_utils.updateEvents(match_id, events);
    res.status(200).send("updated");

  } catch (error) {
    next(error);
  }
});

router.get("/futureSeasonGames/:teamName", async (req, res, next) => {

  try {
    const teamName = req.params.teamName;
    const matches = await matches_utils.getAllFutureGames();
    future_game=[];
    for(let i=0 ; i<matches.length ;i++){
      if(matches[i].homeTeam==teamName ||matches[i].awayTeam==teamName)
      future_game.push(matches[i]);
    }
    if (!teamName || teamName === ":") {
      res.status(400).send("no arguments given");
    }
    else
      res.status(200).send(future_game);

  } catch (error) {
    next(error);
  }
});

async function getMatches(match_ids) {

}


router.get("/favoriteMatches", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    console.log(req.session.user_id);
    const match_ids = await users_utils.getFavoriteMatches(user_id);
    matchs_array = [];
    for (let i = 0; i < match_ids.length; i++) {
      id = match_ids[i].match_id;
      const match = await matches_utils.getMatchById(id);
      console.log(match);
      if (match) {
        for (let j = 0; j < match.length; j++) {
          matchs_array.push(match[j]);
        }
      }
    }
    console.log(matchs_array)
    res.status(200).send(matchs_array);
  } catch (error) {
    next(error);
  }
});


router.get("/getAllFutureGames", async (req, res, next) => {

  try {
    const matches = await matches_utils.getAllFutureGames();
    res.status(200).send(matches);

  } catch (error) {
    next(error);
  }
});

router.get("/regressionTest1", (req, res, next) => {
  try {
    res.status(400).send("test");

  } catch (error) {
    res.status(400).send("test");
  }
});

router.get("/getAllPastGames", async (req, res, next) => {

  try {
    console.log("here")
    const matches = await matches_utils.getPastGames();
    console.log(matches)
    res.status(200).send(matches);

  } catch (error) {
    next(error);
  }
});

router.get("/closestGame", async (req, res, next) => {

  try {

        //  host: København
    //  guest: Silkeborg
    //  date: 2021-05-21
    //  time: 20:00:00
    //  stadium: West Ham United
//
    res.status(200).send({
      "ID": "1111116",
      "awayTeam": "Randers",
      "date": "2021-08-22T00:00:00.000Z",
      "events": null,
      "homeTeam": "Nordsjælland",
      "referee": "Heldermartinez1",
      "scoreAway": null,
      "scoreHome": null,
      "stadium": "Right to Dream Park",
      "time": "1970-01-01T20:00:00.000Z",
    });
  }

   catch (error) {
    next(error);
  }
});


module.exports = router;