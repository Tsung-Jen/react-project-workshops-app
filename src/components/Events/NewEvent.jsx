import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { createNewEvent } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { queryClient } from "../../util/http.js";

export default function NewEvent() {
  const navigate = useNavigate();

  // mutate from useMutation is a function which can be called to send createNewEvent request
  // useMutation does not send the request automatically by React-Query
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createNewEvent,
    // onSuccess is a function that only executes once mutationFn succeeded
    onSuccess: () => {
      // tell React-Query that the data fetched by certain query is outdated, here we invalidate (mark as stale) any queryKey that does include "events" as queryKey
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
  });

  function handleSubmit(formData) {
    // data format should be equivalent on the backend (an object with event property in this case) 
    mutate({ event: formData });
  }

  return (
    <Modal onClose={() => navigate("../")}>
      <EventForm onSubmit={handleSubmit}>
        {isPending && "Submitting..."}
        {!isPending && (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Create
            </button>
          </>
        )}
      </EventForm>
      {isError && (
        <ErrorBlock
          title="Failed to create event."
          message={
            error.info?.message ||
            "Failed to create event. Please check your inputs and try again later."
          }
        />
      )}
    </Modal>
  );
}
