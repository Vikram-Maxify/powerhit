import { CheckCircle, Globe, MapPin } from "lucide-react";

const countries = [
  { name: "India", flag: "https://flagcdn.com/w80/in.png", code: "IN" },
  { name: "Australia", flag: "https://flagcdn.com/w80/au.png", code: "AU" },
  { name: "Pakistan", flag: "https://flagcdn.com/w80/pk.png", code: "PK" },
  { name: "Bangladesh", flag: "https://flagcdn.com/w80/bd.png", code: "BD" },
  { name: "Nepal", flag: "https://flagcdn.com/w80/np.png", code: "NP" },
  { name: "Dubai", flag: "https://flagcdn.com/w80/ae.png", code: "UAE" },
];

const CountriesAndDailyClaim = () => {
  const goldenTextStyle = {
    background: "linear-gradient(135deg, #7b5800 0%, #fdba12 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <section className="bg-surface px-4 md:px-8 py-6 md:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* <div className="absolute -inset-1  rounded-full blur-md opacity-30 animate-pulse"></div> */}

              <div className="relative p-2 ">
                <Globe className="text-black" size={20} />
              </div>
            </div>

            <div>
              <h2
                className="text-lg md:text-2xl font-black"
                // style={goldenTextStyle}
              >
                Available in Countries
              </h2>

              <p className="text-xs text-gray-500 font-medium">
                Global Lottery Access
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-600">ACTIVE</span>
          </div>
        </div>

        {/* Countries */}
        <div className=" overflow-hidden">
          <div className="grid grid-cols-6">
            {countries.map((country, index) => (
              <div
                key={country.code}
                className={`group flex flex-col items-center justify-center px-2 py-4 md:py-6 transition-all duration-300 hover:bg-gray-50 hover:-translate-y-1 ${
                  index !== countries.length - 1 ? "" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={country.flag}
                    alt={country.name}
                    loading="lazy"
                    className="w-9 h-9 sm:w-10 sm:h-10 md:w-16 md:h-16 rounded-full border-2 border-gray-200 object-cover transition-all duration-300 group-hover:border-yellow-400 group-hover:scale-110 shadow-sm"
                  />

                  {/* <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[7px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow">
                    {country.code}
                  </div> */}
                </div>

                <span className="mt-3 text-[8px] sm:text-[9px] md:text-xs font-medium text-gray-600 text-center leading-tight">
                  {country.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="text-yellow-500" size={15} />
            <span className="text-xs text-gray-500 font-medium">
              {countries.length} Countries Supported
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-500">Available Worldwide</span>
          </div>
        </div>
      </div>

      <style>{`
        .bg-surface{
          background:#f7f9fb;
        }

        @keyframes pulse{
          0%,100%{opacity:1;}
          50%{opacity:.5;}
        }

        .animate-pulse{
          animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite;
        }
      `}</style>
    </section>
  );
};

export default CountriesAndDailyClaim;
