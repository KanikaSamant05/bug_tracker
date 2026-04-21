// Footer.jsx

function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white py-6 px-5 flex justify-between items-center text-xs text-gray-400">
      <span>© {new Date().getFullYear()} Bug Tracker. All rights reserved.</span>
      <span>Built with React + Node.js</span>
    </footer>
  );
}

export default Footer;