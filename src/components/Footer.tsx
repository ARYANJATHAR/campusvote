import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
              <i className="fa-brands fa-twitter text-lg"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
              <i className="fa-brands fa-instagram text-lg"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
              <i className="fa-brands fa-tiktok text-lg"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
              <i className="fa-brands fa-discord text-lg"></i>
            </a>
          </div>
          <div className="flex space-x-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-purple-600 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-purple-600 transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-purple-600 transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} CampusVotes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 