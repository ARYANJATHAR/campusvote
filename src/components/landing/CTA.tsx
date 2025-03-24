import { Section } from "@/components/ui/section";
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";

export function CTA() {
  return (
    <>
      <Section className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl max-w-4xl mx-auto">
                Ready to Start Your Journey?
              </h2>
              <p className="mx-auto mt-6 text-lg leading-7 text-indigo-100 max-w-3xl">
                Join thousands of students who are already participating in the most exciting campus voting platform. Create your profile and start making an impact today!
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <GradientButton 
                    className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group text-base px-6 py-3"
                  >
                    <span className="flex items-center justify-center">
                      <i className="fas fa-user-plus mr-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                      Get Started Now
                    </span>
                  </GradientButton>
                </Link>
                <Link href="/leaderboard" className="w-full sm:w-auto">
                  <GradientButton 
                    variant="outline"
                    className="w-full sm:w-auto bg-transparent text-white border-2 border-white hover:bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group text-base px-6 py-3"
                  >
                    <span className="flex items-center justify-center">
                      <i className="fas fa-trophy mr-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                      View Leaderboard
                    </span>
                  </GradientButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-heart-pulse text-2xl text-indigo-500"></i>
                <span className="text-xl font-bold text-white">CampusVotes</span>
              </div>
              <p className="text-sm">
                Making campus voting exciting and engaging for students everywhere.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-indigo-400 transition-colors duration-300">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="hover:text-indigo-400 transition-colors duration-300">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-indigo-400 transition-colors duration-300">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-indigo-400 transition-colors duration-300">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-indigo-400 transition-colors duration-300">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-indigo-400 transition-colors duration-300">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors duration-300">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors duration-300">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors duration-300">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors duration-300">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">
                © {new Date().getFullYear()} CampusVotes. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-sm hover:text-indigo-400 transition-colors duration-300">
                  Support
                </a>
                <a href="#" className="text-sm hover:text-indigo-400 transition-colors duration-300">
                  FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
} 