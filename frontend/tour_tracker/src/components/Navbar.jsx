import React from "react";
import LOGO from "../assets/images/logos.png";
import ProfileInfo from "./Cards/ProfileInfo";

const Navbar = ({ userInfo, onLogout }) => {
  return (
    <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow sticky top-0 z-10">
      <img src={LOGO} alt="travel story" className="h-9" />
      <ProfileInfo userInfo={userInfo} onLogout={onLogout} />
    </div>
  );
};

export default Navbar;


