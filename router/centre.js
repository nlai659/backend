import express from "express";
import {
  getAllCentre,
  addCentre,
  retrieveSingleCentre,
  getCentreByName
} from "../dao/centres/centres-dao";
import {
  getCentreByUserId
} from "../dao/users/users-dao";

import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { isAdmin, isVet, isVolunteer } from "../middleware/authMiddleware";

const centresRouter = new express.Router();

centresRouter.get("/centres", isVolunteer, async (req, res) => {
  const centres = await getAllCentre();

  console.log(centres, 19);

  if (centres.length === 0) {
    return res.status(StatusCodes.NO_CONTENT).send(ReasonPhrases.NO_CONTENT);
  }
  return res.status(StatusCodes.OK).json(centres);
});

centresRouter.get("/centres/restricted", async (req, res) => {
  const centres = await getAllCentre();

  console.log(centres, 19);

  if (centres.length === 0) {
    return res.status(StatusCodes.NO_CONTENT).send(ReasonPhrases.NO_CONTENT);
  }

  let centresDto = []; 

  centres.forEach((centre) => {
    const centreEntry = {
      id: centre._id, 
      name: centre.name, 
      location: centre.location
    }

    centresDto.push(centreEntry);
  }); 

  console.log(centresDto, 48);

  return res.status(StatusCodes.OK).json(centresDto);
});

centresRouter.get("/centres", isVolunteer, async (req, res) => {
  const centres = await getAllCentre();

  console.log(centres, 19);

  if (centres.length === 0) {
    return res.status(StatusCodes.NO_CONTENT).send(ReasonPhrases.NO_CONTENT);
  }
  return res.status(StatusCodes.OK).json(centres);
});

centresRouter.get("/centres/:centreId", isVolunteer, async (req, res) => {
  const centreId = req.params.centreId;
  console.log(centreId)
  const centre = await retrieveSingleCentre(centreId);
  if (!centre) {
    return res.status(StatusCodes.NOT_FOUND).send(ReasonPhrases.NOT_FOUND);
  }
  return res.status(StatusCodes.OK).json(centre);
});

centresRouter.post("/centres", isAdmin, async (req, res) => {
  const newCentre = await addCentre(req.body);

  return res
    .status(StatusCodes.CREATED)
    .header("resource", `/centres/${newCentre._id}`)
    .json(newCentre);
});

// get centre by name
centresRouter.get("/centres/name/:centreName", isVolunteer, async (req, res) => {
  
  const centreName = req.params.centreName;

  // add the new user to the centre specified using the name of the centre 
  const centre = await getCentreByName(centreName);

  if (!centre){
      res.status(422).send("Incorrect centre name specified in path param.");
  }

  return res.status(StatusCodes.OK).json(centre);
});

// get centre by user id
centresRouter.get("/centres/userId/:userId",isVolunteer, async (req, res) => {
  const userId = req.params.userId;

  console.log(userId)

  // add the new user to the centre specified using the name of the centre 
  const centre = await getCentreByUserId(userId);

  console.log(centre)

  if (!centre){
      res.status(422).send("Incorrect centre name specified in path param.");
  }

  return res.status(StatusCodes.OK).json(centre);
});



export default centresRouter;
