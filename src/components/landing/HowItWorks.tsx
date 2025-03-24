import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { FeatureCard } from "./FeatureCard";

const howItWorks = [
  {
    title: "Create Your Profile",
    description: "Sign up and create your profile with your best photos and information. Make yourself stand out to potential voters!",
    image: "/1.webp",
    icon: "fa-user-plus",
  },
  {
    title: "Get Nominated",
    description: "Get nominated by your friends or nominate yourself. The more nominations you get, the higher your chances of winning!",
    image: "/2.webp",
    icon: "fa-star",
  },
  {
    title: "Win the Title",
    description: "Get votes from your peers and climb the leaderboard. The most popular candidates will be crowned as campus favorites!",
    image: "/3.webp",
    icon: "fa-trophy",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-gradient-to-b from-white to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <Heading level={2} className="text-3xl sm:text-4xl font-bold">
            <span className="text-gray-900">How It</span>{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
              Works
            </span>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Follow these simple steps to participate in the most exciting campus competition
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {howItWorks.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              index={index}
              className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            />
          ))}
        </div>
      </div>
    </Section>
  );
} 