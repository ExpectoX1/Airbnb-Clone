import React, { useEffect, useState } from "react";
import Perks from "../Perks";
import axios from "axios";
import PhotosUploader from "../PhotosUploader";
import AccountNav from "./AccountNav";
import { Navigate, useParams } from "react-router-dom";

export default function PlacesFormPage() {
  const [title, setTitle] = useState("");
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState([]);
  const [extraInfo, setExtraInfo] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [redirect, setRedirect] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    axios.get("/places/" + id).then((response) => {
      const { data } = response;
      setTitle(data.title);
      setAddress(data.address);
      setAddedPhotos(data.photos);
      setDescription(data.description);
      setPerks(data.perks);
      setExtraInfo(data.extraInfo);
      setCheckIn(data.checkIn);
      setCheckOut(data.checkOut);
      setMaxGuests(data.maxGuests);
    });
  }, [id]);

  function inputHeader(text) {
    return <h2 className="text-2xl mt-4">{text}</h2>;
  }
  function inputDescription(text) {
    return <p className="text-gray-500 text-sm">{text}</p>;
  }
  function preInput(header, description) {
    return (
      <>
        {inputHeader(header)}
        {inputDescription(description)}
      </>
    );
  }
  async function savePlace(ev) {
    ev.preventDefault();
    const placeData = {
      title,
      address,
      addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    };
    if (id) {
        //update
      await axios.put("/places", {
        id,
        ...placeData,
      });
      setRedirect(true);
    } else {
      await axios.post("/places", placeData);
      setRedirect(true);
    }
  }

  if (redirect) {
    return <Navigate to="/account/places" />;
  }

  return (
    <div className="max-w-4xl mx-auto ">
      <AccountNav />
      <form onSubmit={savePlace}>
        {preInput(
          "Title",
          "Title for your place , it should be short and catchy"
        )}
        <input
          type="text"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          placeholder="Title for example: My Lovely Apartment"
        />
        {preInput("Address", "Address of your place (street, city, country)")}
        <input
          type="text"
          placeholder="address"
          value={address}
          onChange={(ev) => setAddress(ev.target.value)}
        />
        {preInput("Photos", "Add photos of your place more=better")}
        <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos} />

        {preInput("Description", "Describe your place, what makes it special?")}
        <textarea
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
        />
        {preInput("Perks", "What perks does your place have?, Select them all")}
        <div className="grid mt-2 gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <Perks selected={perks} onChange={setPerks} />
        </div>

        {preInput("Extra Info", "Add extra info about your place")}
        <textarea
          value={extraInfo}
          onChange={(ev) => setExtraInfo(ev.target.value)}
        />

        {preInput("Check In/Out", "Add check in/out times")}
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <h3 className="mt-2 -mb-1 ">Check In Time</h3>
            <input
              value={checkIn}
              onChange={(ev) => setCheckIn(ev.target.value)}
              type="text"
              placeholder="16:00"
            />
          </div>
          <div>
            <h3 className="mt-2 -mb-1 ">Check Out Time</h3>
            <input
              value={checkOut}
              onChange={(ev) => setCheckOut(ev.target.value)}
              type="text"
              placeholder="21:30"
            />
          </div>
          <div>
            <h3 className="mt-2 -mb-1 ">Max Number of Guests</h3>
            <input
              value={maxGuests}
              onChange={(ev) => setMaxGuests(ev.target.value)}
              type="number"
              placeholder="4"
            />
          </div>
        </div>
        <div>
          <button className="primary my-4">Save</button>
        </div>
      </form>
    </div>
  );
}
