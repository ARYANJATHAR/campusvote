import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    title: "Real-time Voting",
    description: "Watch the leaderboard update instantly as votes come in. See who's trending and who's climbing the ranks!",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000",
    icon: "fa-bolt",
  },
  {
    title: "Profile Customization",
    description: "Make your profile stand out with custom photos, bio, and achievements. Show off your best self!",
    image: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=1000",
    icon: "fa-user-edit",
  },
  {
    title: "Profile Dashboard",
    description: "Track your performance with detailed analytics. See your voting history and campaign stats!",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
    icon: "fa-chart-line",
  },
];

export function Features() {
  return (
    <Section id="features" className="bg-gradient-to-b from-white to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <Heading level={2} className="text-3xl sm:text-4xl font-bold">
            <span className="text-gray-900">Amazing</span>{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
              Features
            </span>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to make your campus voting experience exciting and engaging
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
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