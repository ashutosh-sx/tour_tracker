import React from "react";

// Helper function to get initials from a name
const getInitials = (name) => {
  if (!name) return "";

  const words = name.split(" ");
  let initials = "";

  for (let i = 0; i < Math.min(words.length, 2); i++) {
    initials += words[i][0];
  }

  return initials.toUpperCase();
};

const ProfileInfo = ({ userInfo, onLogout }) => {
  // Debug log for userInfo
  console.log("ProfileInfo received userInfo:", userInfo);

  const initials = userInfo?.fullName ? getInitials(userInfo.fullName) : "";

  return (
    <div className="flex items-center gap-3">
      {/* Profile avatar with initials */}
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-950 font-medium">
        {initials}
      </div>

      {/* User information and logout button */}
      <div className="flex flex-col">
        <p className="text-sm font-medium">{userInfo?.fullName || ""}</p>
        <button
          className="text-sm text-slate-700 hover:underline"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileInfo;



