import axios from "axios";
import { useEffect, useState } from "react";
import Table from "react-bootstrap/esm/Table";
import ROW from "./ROW";

function Review({ account, github }) {
  const [data, setData] = useState([]);
  const [reviewd, setReviewd] = useState(false);
  useEffect(() => {
    (async function () {
      try {
        const res = await axios.get(
          process.env.REACT_APP_API_URI + "/contribution",
          {
            params: {
              wallet_address: account
            }
          }
        );

        setData(res.data);
      } catch (err) {
        alert(err.response.data.msg);
      }
    })();
  }, [reviewd, account]);

  const onReview = async (id, accept) => {
    try {
      await axios.post(process.env.REACT_APP_API_URI + "/review", {
        github_access_token: github,
        contribution: id,
        wallet_address: account,
        accept
      });
      setReviewd(!reviewd);
    } catch (err) {
      alert(err.response.data.msg);
    }
  };

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Contributions</th>
          {/* <th>Status</th> */}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data &&
          data.length &&
          data.map((e) => (
            <ROW
              key={e.id}
              id={e.id}
              Contribution={e.description}
              review={onReview}
            />
          ))}
      </tbody>
    </Table>
  );
}

export default Review;
