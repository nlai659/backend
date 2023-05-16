import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import path from "path";
import * as url from "url";

import dogsRouter from "../router/dogs.js";
import scalesRouter from "../router/scales.js";
import usersRouter from "../router/users.js";
import centresRouter from "../router/centre.js";
import chatRouter from "../router/chats.js";

import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swaggerDocument.json" assert { type: "json" };
import cors from 'cors';
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// takes care of the CORS error, have to specify the methods that are allowed when interacting with this backend

app.use(cors());

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// register the routers
app.use(dogsRouter);
app.use(usersRouter);
app.use(centresRouter);
app.use(scalesRouter);
app.use(chatRouter);

// register the documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  res.status(status).json({ message: message });

  // this means that the front end when error handling can also access the message property
  // eg catch(error => console.log(error.message))
});

// Make the "public" folder available statically, all the images and static files we can serve
// to the front end from this folder directly
const dirname = url.fileURLToPath(new URL(".", import.meta.url));
app.use(express.static(path.join(dirname, "../public")));

// Serve up the frontend's "dist" directory, if we're running in production mode.
if (process.env.NODE_ENV === "production") {
  console.log("Running in production!");

  // Make all files in that folder public
  app.use(express.static(path.join(dirname, "../../web-group-16/dist")));

  // If we get any GET request we can't process using one of the server routes, serve up index.html by default.
  app.get("*", (req, res) => {
    res.sendFile(path.join(dirname, "../../web-group-16/dist/index.html"));
  });
}

// Start the DB running. Then, once it's connected, start the server.
// IMPORTANT: connect to db before making server public
mongoose
  .connect(process.env.DB_URL, { useNewUrlParser: true })
  .then(() =>
    app.listen(port, () => console.log(`App server listening on port ${port}!`))
  )
  .catch((error) =>
    console.log("There is an error with the Mongoose connection: " + error)
  );
