import {
  Link,
  redirect,
  useNavigate,
  useParams,
  useSubmit,
  useNavigation,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
// import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import EventForm from "./EventForm.jsx";
import { fetchEvent, updateEvent, queryClient } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const params = useParams();
  const submit = useSubmit();

  const { data, isError, error } = useQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
    staleTime: 10000, // 10 seconds, React Query will wait for 10 seconds then send a new request again
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   // onMutate function will be executed when you call mutate function, so before the process of mutate is done and before you got back a response
  //   // it allows us to update the data that is cached by React Query
  //   // React Query passes this data which you passed to mutate (formData in this case), as a value to onMutate by default
  //   onMutate: async (data) => {
  //     // get currently stored data and manipulate the data
  //     const newEvent = data.event; // event is a property we sent to mutate function

  //     await queryClient.cancelQueries({ queryKey: ["events", params.id] }); // cancel all active queries for a specific key (it's important for Optimistic Updating!), it returns a Promise
  //     // get currently stored query data
  //     const previousEvent = queryClient.getQueryData(["events", params.id]);

  //     queryClient.setQueryData(["events", params.id], newEvent);

  //     return { previousEvent }; // this returned object will be the context in onError
  //   },
  //   // onError function will be executed when the mutationFn (updateEvent) fails
  //   onError: (error, data, context) => {
  //     queryClient.setQueryData(["events", params.id], context.previousEvent); // rollback to the old data if updating process has error in backend
  //   },
  //   // onSettled function will be called whenever the mutationFn is done (no matter if the updateEvent failed or succeeded)
  //   // be sure that you really got the same (latest) data in frontend as you have on your backend
  //   onSettled: () => {
  //     queryClient.invalidateQueries(["events", params.id]);
  //   },
  // });

  function handleSubmit(formData) {
    // mutate({ id: params.id, event: formData });
    // navigate("../");
    submit(formData, { method: "PUT" });
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  // if (isPending) {
  //   content = (
  //     <div className="center">
  //       <LoadingIndicator />
  //     </div>
  //   );
  // }

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="Failed to load event"
          message={
            error.info?.message ||
            "Failed to load event. Please check your inputs and try again later."
          }
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        {state === "submitting" ? (
          <p>Update submitting...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

export function loader({ params }) {
  // fetchQuery allows us to trigger a query programmatically, so do it ourself without using the useQuery hook
  // React Query will go ahead and send that request and will then store that response data in the cache
  queryClient.fetchQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });

  return null;
}

export async function action({ request, params }) {
  const formData = await request.formData(); // formData() is provided by React Router that allows us to get hold of the submitted data
  const updatedEventData = Object.fromEntries(formData); // convert formData to a simple key value pair object in JS
  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(["events"]); // make sure the updated data is fetched again

  return redirect("../");
}
