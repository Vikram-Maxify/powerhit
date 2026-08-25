import {
  ArrowRight,
  Award,
  Headphones,
  Mail,
  Share2,
  Shield,
} from "lucide-react";

const Footer = () => {
  const goldenTextStyle = {
    background: "linear-gradient(135deg, #7b5800 0%, #fdba12 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <footer className="bg-surface border-t border-white/40 px-4 md:px-6 pt-3 pb-2 md:py-16">
      <div className="max-w-8xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-8 md:mb-12">
          {/* Logo & Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://i.ibb.co/jkP01dVv/Gemini-Generated-Image-e4g7kpe4g7kpe4g7.png"
                alt="WINZOX Logo"
                className="h-12"
              />
            </div>

            <p className="text-gray-500 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed max-w-xs">
              The world's leading global lottery platform. Trusted by millions,
              designed for winners.
            </p>

            <div className="flex gap-3">
              <a
                href="#"
                className="w-8 h-8 md:w-10 md:h-10 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-white hover:border-yellow-400 transition-all duration-300 shadow-sm group"
              >
                <Share2
                  size={16}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </a>
              <a
                href="#"
                className="w-8 h-8 md:w-10 md:h-10 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-white hover:border-yellow-400 transition-all duration-300 shadow-sm group"
              >
                <Headphones
                  size={16}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </a>
              <a
                href="#"
                className="w-8 h-8 md:w-10 md:h-10 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-white hover:border-yellow-400 transition-all duration-300 shadow-sm group"
              >
                <Mail
                  size={16}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5
              className="font-black text-sm md:text-base mb-4 md:mb-6 uppercase tracking-wider"
              style={goldenTextStyle}
            >
              Quick Links
            </h5>
            <ul className="space-y-2.5 md:space-y-3.5 text-xs md:text-sm">
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  How to Play
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Lottery Results
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  VIP Program
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Affiliate Partners
                </a>
              </li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h5
              className="font-black text-sm md:text-base mb-4 md:mb-6 uppercase tracking-wider"
              style={goldenTextStyle}
            >
              Security
            </h5>
            <ul className="space-y-2.5 md:space-y-3.5 text-xs md:text-sm">
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Responsible Gaming
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-yellow-600 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span className="w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Licensing
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h5
              className="font-black text-sm md:text-base mb-4 md:mb-6 uppercase tracking-wider"
              style={goldenTextStyle}
            >
              Newsletter
            </h5>
            <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">
              Stay updated on new jackpots.
            </p>
            <div className="relative">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-yellow-400/50 text-sm outline-none transition-all duration-300 placeholder:text-gray-400"
              />
              <button className="absolute right-1.5 top-[20%] -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-1.5 md:p-2 rounded-lg hover:scale-105 transition-transform shadow-md">
                <ArrowRight size={16} className="text-white" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
              <Shield size={12} className="text-green-500" />
              <span>We respect your privacy</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 md:pt-8 border-t border-gray-200/50 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
            © 2024 WINZOX GLOBAL GAMING. ALL RIGHTS RESERVED.
          </p>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <Award size={14} className="text-yellow-500" />
              <span className="text-[10px] text-gray-400 font-medium">
                Licensed
              </span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex gap-3 md:gap-4">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhRAp3GdAJ6pTpxkm7CiNfu4DSbjeO-iWdoRznu8yUM9TY7gMJZUbxXBZrk64Rnpz4HU0gbCT5Ur_PIiF2z6sWKz-yrkW1kefNaYqE0YPsfHTd61LrQ6c56GcQpsoFa4I4p9tsn_PkUqYGKMLN_rJz5cijn7fZczaNZXU6dPFAmrzt5Jj3_ra6x9aHSufTS3f7HvosFDyqtcnNfTWCZFQEZNJvsFkfM0dT-bAUzqVoaZrS0GLEBIU77g0XXHvMh8C8AyKSaAPe7Iw"
                alt="payment"
                className="h-5 md:h-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer hover:opacity-100"
              />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOkHXeu6eoMIjWj9IYsC4DVGanYpZPGg_g6ZNXF9KVcYBT8mfnXwuDQAjKaF1mD9bpD2s2tE-4viA9IVlPKgB7Vl5UU61sd30eWfzHdc9ctueoODu0Ud-Hsx-0z8AJLQI9icyleRxk75qMkV1yF7pOXSYmahwOKWek2i7ooLF6dlseT3OVhwnQejID2Bih-23RBQnmzAZQh8KwmmRQrNLo9FcFSTzgeaXoRUwmbu4-woGbHTsZ6g4HVb1R-22M602b3fk8Yb9E1KA"
                alt="secure"
                className="h-5 md:h-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer hover:opacity-100"
              />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwMb43gyfJTt4qvuWUyew5icFiBngjVISnQ-XZJWKADW0CeSl89O5vAlp50VdETru4ZFfzEPmQVUuh6wInoFYNs2sinyKGtwnQBHVKExYaOoOAbvWGrlf-S0zy7b_ua9tKbhZKZclrzC9__epgRgmQetY1B-dLmdkS81WVM7RQht-_FoGyROpnW-YRdVdtpVc2CoS71oCXjZSdPpNhKAkTt9iCrxCuv95oduKCAvAF-i_AMP6DKsIfcrHogdTKyW_UzQJ__U1Z6tU"
                alt="18+"
                className="h-5 md:h-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-surface {
          background-color: #f7f9fb;
        }
        .border-glass-border {
          border-color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
