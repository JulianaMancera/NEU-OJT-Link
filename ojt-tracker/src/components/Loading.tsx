import loading from "../assets/loading-main.gif";

export const Loading = () => {
  return (
    <div className="fixed flex inset-0 z-50 justify-center items-center bg-white ">
      <img src={loading} alt="Loading..." className="w-120 h-120" />
    </div>
  );
};
