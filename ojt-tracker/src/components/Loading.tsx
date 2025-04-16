import loading from "../assets/loading-main.gif";

export const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <img src={loading} alt="Loading..." className="w-32 h-32" />
    </div>
  );
};
