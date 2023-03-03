import Button from "react-bootstrap/esm/Button";

function ROW({ id, Contribution, review }) {
  const YESHandle = (e) => {
    review(id, true);
  };
  const NOHandle = (e) => {
    review(id, false);
  };
  return (
    <tr>
      <td>{Contribution}</td>
      <td>
        <Button className="btn btn-success mx-2" onClick={(e) => YESHandle(e)}>
          YES
        </Button>
        <Button className="btn btn-danger mx-2" onClick={(e) => NOHandle(e)}>
          NO
        </Button>
      </td>
    </tr>
  );
}
export default ROW;
