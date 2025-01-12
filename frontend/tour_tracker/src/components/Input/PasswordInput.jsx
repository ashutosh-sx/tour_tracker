import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={isShowPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Password"}
        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700 pr-12"
      />
      <button
        type="button"
        onClick={() => setIsShowPassword(!isShowPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2"
      >
        {isShowPassword ? (
          <FaRegEye size={20} className="text-blue-500" />
        ) : (
          <FaRegEyeSlash size={20} className="text-blue-500" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;






