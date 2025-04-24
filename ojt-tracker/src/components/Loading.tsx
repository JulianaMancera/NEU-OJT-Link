export const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-gradient-to-br from-[#1B38AC] to-[#7792FD]">
      <div className="flex items-center space-x-2">
        {/* Spinning Icon */}
        <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
        {/* Loading Text */}
        <h1 className="text-white text-xl font-sans">Loading</h1>
      </div>
      {/* Progress Bar */}
      <div className="absolute bottom-70 w-1/2 h-1 bg-blue-800 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-white animate-progress"></div>
      </div>
    </div>
  );
};