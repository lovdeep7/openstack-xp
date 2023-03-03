import { useState } from "react";
import axios from "axios";

function Contribution({ account, github }) {
  const [hash, setHash] = useState("");

  const SubmitHandle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(process.env.REACT_APP_API_URI + "/contribution", {
        github_access_token: github,
        contribution: hash,
        wallet_address: account
      });

      alert("Success");
    } catch (err) {
      alert(err.response.data.msg);
    }
  };
  return (
    <form className="form-inline" onSubmit={(e) => SubmitHandle(e)}>
      <div className="form-group mx-sm-3 mb-2">
        <label htmlFor="hash" className="sr-only">
          Enter a hash value:
        </label>
        <input
          type="text"
          className="form-control"
          id="hash"
          name="hash"
          placeholder="Enter a hash value"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary mb-2">
        Submit
      </button>
    </form>
  );
}

export default Contribution;
