import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import Image from "next/image";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Student Body President",
    content: "CampusVotes has revolutionized how we conduct campus elections. The real-time updates and beautiful interface make voting exciting and engaging!",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1000",
  },
  {
    name: "Michael Chen",
    role: "Campus Influencer",
    content: "I love how easy it is to create my profile and showcase my achievements. The voting process is smooth and the results are instant!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1000",
  },
  {
    name: "Emma Davis",
    role: "Student Council Member",
    content: "The analytics dashboard helps me understand my campaign's performance. It's amazing to see how my profile is doing in real-time!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=1000",
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials" className="bg-gradient-to-b from-white to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <Heading level={2} className="text-3xl sm:text-4xl font-bold">
            <span className="text-gray-900">What Our</span>{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
              Users Say
            </span>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of students who are already enjoying the CampusVotes experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-indigo-100 group-hover:ring-indigo-200 transition-all duration-300">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-indigo-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="mt-4 flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-sm"></i>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
} 