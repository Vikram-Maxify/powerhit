import { CircleCheckBig } from "lucide-react";

const rules = [
  "Only valid users are eligible.",
  "Commission is credited automatically.",
  "Users must complete recharge.",
  "Fake referrals will be removed.",
  "Unlimited referral earnings.",
];

const ReferralRules = () => {
  return (
    <div className="mt-6 bg-white rounded-3xl shadow border border-gray-100 p-5">

      <h2 className="text-lg font-bold mb-5">
        Referral Rules
      </h2>

      <div className="space-y-4">

        {rules.map((rule, index) => (
          <div
            key={index}
            className="flex items-start gap-3"
          >
            <CircleCheckBig
              className="text-green-500 mt-1"
              size={18}
            />

            <p className="text-sm text-gray-600">
              {rule}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
};

export default ReferralRules;