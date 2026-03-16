import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaYoutube, FaTiktok, FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-slate-300 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* About Project */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">AI Plant Disease Detection System</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Developed for Machine Unlearning Research.<br/>
            Computer Science Thesis.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/guide" className="hover:text-white transition-colors">User Guide</Link></li>
            <li><Link to="/pol" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/admin/dashboard" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Connect</h3>
          <div className="flex gap-4">
            <a href="https://facebook.com/project" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors text-2xl">
              <FaFacebook />
            </a>
            <a href="https://youtube.com/project" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-red-500 transition-colors text-2xl">
              <FaYoutube />
            </a>
            <a href="https://tiktok.com/project" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors text-2xl">
              <FaTiktok />
            </a>
            <a href="https://github.com/project" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors text-2xl">
              <FaGithub />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
