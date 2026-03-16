import React from 'react';
import { FaFacebook, FaYoutube, FaTiktok, FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Cột 1 */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">About Project</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            AI Plant Disease Detection System<br />
            Developed for Machine Unlearning Research.
          </p>
        </div>

        {/* Cột 2 */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-white transition-colors">User Guide</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Dataset Info</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>

        {/* Cột 3 */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Social Media</h3>
          <div className="flex gap-4">
            <a href="https://facebook.com/project" target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110">
              <FaFacebook size={20} />
            </a>
            <a href="https://youtube.com/project" target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-full hover:bg-red-600 hover:text-white transition-all transform hover:scale-110">
              <FaYoutube size={20} />
            </a>
            <a href="https://tiktok.com/project" target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-full hover:bg-black hover:text-white transition-all transform hover:scale-110">
              <FaTiktok size={20} />
            </a>
            <a href="https://github.com/project" target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 hover:text-white transition-all transform hover:scale-110">
              <FaGithub size={20} />
            </a>
          </div>
        </div>

      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Machine Unlearning Research. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
