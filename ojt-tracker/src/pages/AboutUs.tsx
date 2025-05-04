import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Settings, CircleHelp, LogOut, Github, MapPin, Calendar, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import OJTLogo from "../assets/ojt-white.png"; 
import Logo from "../assets/loading-logo.png";
import { supabase } from "../../supabase";

interface AboutUsProps {
  handleLogout: () => void;
}

const AboutUs = ({ handleLogout }: AboutUsProps) => {
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/student-dashboard";

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "User");
        const { data: roleData } = await supabase
          .from("user")
          .select("role, profilePicture")
          .eq("user_id", user.id)
          .single();

        if (roleData) {
          setUserRole(roleData.role);
          setProfilePicture(roleData.profilePicture);
        }

        // Check if user has applied for any position
        if (roleData?.role === "student") {
          const { data: applicationData } = await supabase
            .from("application")
            .select("id")
            .eq("student_id", user.id)
            .limit(1);
          
          // Fix here: Ensure we're setting a boolean value
          setHasApplied(applicationData !== null && applicationData !== undefined && applicationData.length > 0);
        }
      }
    };

    fetchUserData();
  }, []);

  // Handle home button navigation based on user role and application status
  const handleHomeNavigation = () => {
    if (userRole === "admin") {
      navigate("/admin");
    } else if (userRole === "student") {
      if (hasApplied) {
        navigate("/student-dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      // Default route if role is undefined or not recognized
      navigate("/dashboard");
    }
  };

  // Team members data with their details
  const teamMembers = [
    {
      name: "Juliana R. Mancera",
      role: "Scrum Master",
      github: "https://github.com/JulianaMancera",
      expertise: "Team Lead, Project Management, Full Stack Developement, UI/UX Design",
      avatar: "https://avatars.githubusercontent.com/u/133284711?v=4",
      position: "center"
    },
    {
      name: "Vince D. Campos",
      role: "Analyst",
      github: "https://github.com/VinceCampos",
      expertise: "UI/UX Design, Fullstack Developement, Tester",
      avatar: "https://avatars.githubusercontent.com/u/152839517?v=4",
      position: "other"
    },
    {
      name: "Alyssa Mae D. San Pedro",
      role: "Tester",
      github: "https://github.com/AlyssaMaeSanPedro",
      expertise: "Full Stack Developement, UI/UX Design, Database Design",
      avatar: "https://avatars.githubusercontent.com/u/163331805?v=4",
      position: "other"
    },
    {
      name: "Renard B. Macorol",
      role: "Developer 1",
      github: "https://github.com/RenardMacorol",
      expertise: "Backend Development, React",
      avatar: "https://avatars.githubusercontent.com/u/84180143?v=4",
      position: "other"
    },
    {

      name: "Dan Lloyd A. Cabanilla",
      role: "Developer 2",
      github: "https://github.com/DLAyatoCabanilla",
      expertise: "Backend Development, Database Design",
      avatar: "https://avatars.githubusercontent.com/u/139518282?v=4",
      position: "other"
    },
  ];

  // Features data
  const features = [
    {
      title: "Select Companies",
      description: "Browse and choose from available internship providers",
      icon: <MapPin className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Job Search",
      description: "Find specific roles tailored to your skills and interests",
      icon: <Briefcase className="w-8 h-8 text-indigo-600" />
    },
    {
      title: "Submit Requirements",
      description: "Upload essential documents, including: Resume, Cover Letter, Certificate of Matriculation (COM), Curriculum Vitae (CV), Medical Certificate, Notarized Parental Consent, Psychological Test Certification, and Endorsement Letter (auto-generated)",
      icon: <Calendar className="w-8 h-8 text-purple-600" />
    },
    {
      title: "Progress Tracking",
      description: "Use a calendar interface to manage work schedules, track remaining OJT hours (e.g., out of 300 hours), and log work hours. Submit regular updates on tasks and activities. Reflect on experiences and learning. Generate comprehensive progress summaries.",
      icon: <ChevronUp className="w-8 h-8 text-green-600" />
    },
    {
      title: "Admin Dashboard",
      description: "Oversee student progress, access reports, and monitor compliance. Includes Student Monitoring (Application, Monitoring, Reports, Compilation of Reports) and Company Management (Company, Jobs).",
      icon: <User className="w-8 h-8 text-yellow-600" />
    },
    {
      title: "Certificate of Completion",
      description: "Receive a certificate upon fulfilling all OJT requirements",
      icon: <ChevronDown className="w-8 h-8 text-red-600" />
    }
  ];

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#C7D2FF] to-[#4A6DA7] p-4 transition-all duration-500">
      {/* Header */}
      <header className="fixed top-0 h-[80px] left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-md z-50 border-b border-black">
        <div className="flex items-center space-x-4">
          <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
          <button
            onClick={handleHomeNavigation}
            className={`text-white px-5 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
              isHomePage ? "bg-blue-700 hover:brightness-110" : "bg-transparent hover:bg-blue-700"
            }`}
          >
            HOME
          </button>
        </div>
        
        <button
          onClick={() => setProfileOpen(!isProfileOpen)}
          className="relative p-3 hover:bg-blue-800 rounded-full transition-all duration-300 transform hover:scale-105"
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={`${userName}'s Profile`}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 shadow-md"
              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/48")}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center border-2 border-blue-300">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        {isProfileOpen && (
          <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] animate-slide-in-down transition-all duration-300">
            <div className="bg-blue-800 text-white p-4 text-center">
              <div className="w-24 h-24 rounded-full mx-auto overflow-hidden mb-3 border-4 border-blue-300">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={`${userName}'s Profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/96")}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              <p className="font-semibold text-xl">{userName}</p>
              <p className="text-sm text-blue-200 capitalize">{userRole || "N/A"}</p>
            </div>
            <ul className="text-sm">
              <li>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200 hover:pl-8"
                >
                  <User className="w-6 h-6 mr-3" /> Profile
                </button>
              </li>
              <li>
                <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200 hover:pl-8">
                  <Settings className="w-6 h-6 mr-3" /> Settings
                </button>
              </li>
              <li>
                <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200 hover:pl-8">
                  <CircleHelp className="w-6 h-6 mr-3" /> Help & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-red-50 text-red-600 flex items-center transition-all duration-200 hover:pl-8"
                >
                  <LogOut className="w-6 h-6 mr-3" /> Log out
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* About Us Content */}
      <div className="mt-24 max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-16 transform transition-all hover:shadow-blue-200 hover:shadow-2xl max-w-[1600px] mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-800 h-48 relative">
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
            <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-full shadow-xl border-4 border-white">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                <img src={Logo} alt="OJT Link Logo" />
              </div>
            </div>
          </div>
          
          <div className="pt-28 px-12 pb-16">
            <h1 className="text-6xl font-extrabold text-center mb-10 bg-gradient-to-r from-blue-600 to-indigo-800 text-transparent bg-clip-text">
              NEU OJT-Link
            </h1>
            
            <div className="flex justify-center mb-12">
              <div className="flex space-x-10">
                <button 
                  onClick={() => setActiveSection("about")}
                  className={`px-10 py-4 rounded-full text-xl font-medium transition-all ${
                    activeSection === "about" 
                      ? "bg-blue-600 text-white shadow-lg" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  About
                </button>
                <button 
                  onClick={() => setActiveSection("features")}
                  className={`px-10 py-4 rounded-full text-xl font-medium transition-all ${
                    activeSection === "features" 
                      ? "bg-blue-600 text-white shadow-lg" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => setActiveSection("team")}
                  className={`px-10 py-4 rounded-full text-xl font-medium transition-all ${
                    activeSection === "team" 
                      ? "bg-blue-600 text-white shadow-lg" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Our Team
                </button>
              </div>
            </div>
            
            {activeSection === "about" && (
              <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                <div className="text-center">
                  <p className="text-xl text-gray-700 leading-relaxed mb-8 max-w-4xl mx-auto">
                    NEU OJT-Link is a comprehensive platform designed to transform the On-the-Job Training experience for New Era University students. Created as a Software Engineering 2 project by the talented Chronosaurus Team, this innovative system connects academic learning with real-world professional opportunities.
                  </p>
                  
                  <div className="flex flex-col md:flex-row justify-center items-center gap-10 mt-12">
                    <div className="bg-blue-50 p-8 rounded-xl shadow-md flex flex-col items-center text-center w-full md:w-1/3">
                      <div className="bg-blue-100 p-4 rounded-full mb-6">
                        <Briefcase className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-2xl mb-4 text-gray-800">Industry Partnerships</h3>
                      <p className="text-gray-600 text-lg">Connecting students with top companies for meaningful internship experiences</p>
                    </div>
                    
                    <div className="bg-indigo-50 p-8 rounded-xl shadow-md flex flex-col items-center text-center w-full md:w-1/3">
                      <div className="bg-indigo-100 p-4 rounded-full mb-6">
                        <Calendar className="w-10 h-10 text-indigo-600" />
                      </div>
                      <h3 className="font-bold text-2xl mb-4 text-gray-800">Streamlined Process</h3>
                      <p className="text-gray-600 text-lg">From application to certification, manage your entire OJT journey in one place</p>
                    </div>
                    
                    <div className="bg-purple-50 p-8 rounded-xl shadow-md flex flex-col items-center text-center w-full md:w-1/3">
                      <div className="bg-purple-100 p-4 rounded-full mb-6">
                        <MapPin className="w-10 h-10 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-2xl mb-4 text-gray-800">Progress Tracking</h3>
                      <p className="text-gray-600 text-lg">Real-time monitoring of your professional development and milestones</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl my-12">
                  <blockquote className="italic text-xl text-gray-700 text-center">
                    "NEU OJT-Link bridges the gap between academic excellence and professional readiness, empowering students to build their futures with confidence and competence."
                  </blockquote>
                </div>
              </div>
            )}
            
            {activeSection === "features" && (
              <div className="max-w-5xl mx-auto animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {features.map((feature, index) => (
                    <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 flex">
                      <div className="flex-shrink-0 mr-6">
                        <div className="bg-blue-50 p-4 rounded-full">
                          {feature.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-2xl text-gray-800 mb-3">{feature.title}</h3>
                        <p className="text-gray-600 text-lg">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-10 text-white text-center shadow-lg">
                  <h3 className="text-3xl font-bold mb-6">Ready to Start Your Professional Journey?</h3>
                  <p className="mb-8 text-xl">NEU OJT-Link provides everything you need to make your internship experience meaningful and successful.</p>
                  <button className="bg-white text-blue-700 px-10 py-4 rounded-full font-medium text-lg hover:bg-blue-50 transition-colors shadow-md">
                    Explore Opportunities
                  </button>
                </div>
              </div>
            )}
            
            {activeSection === "team" && (
              <div className="animate-fade-in max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center mb-10 text-gray-800">Meet the Chronosaurus Team</h2>
                <p className="text-center text-xl text-gray-600 max-w-4xl mx-auto mb-16">
                We, as passionate 3rd Year BS Computer Science student developers, have worked hard to develop a creative approach that enhances the OJT experience for all NEU students.
                </p>

                <div className="relative flex flex-col items-center">
                  {teamMembers
                    .filter((member) => member.position === "center")
                    .map((member, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 max-w-md w-full mb-12 z-10"
                      >
                        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-800 rounded-t-2xl">
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                            <div className="w-35 h-35 rounded-full bg-white p-1 border-4 border-blue-300">
                              <img
                                src={member.avatar}
                                alt={`${member.name}'s avatar`}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                              />
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-20 rounded-t-full"></div>
                        </div>
                        <div className="pt-20 px-8 pb-8 text-center">
                          <h3 className="text-2xl font-bold text-gray-800">{member.name}</h3>
                          <p className="text-blue-600 text-lg font-medium mb-6">{member.role}</p>
                          <div className="space-y-4 mb-8">
                            <div className="flex items-start justify-center">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1 mr-4">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                              </div>
                              <p className="text-lg text-gray-600">{member.expertise}</p>
                            </div>
                            <div className="flex items-start justify-center">
                             
                            </div>
                          </div>
                          <a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-lg shadow-sm"
                          >
                            <Github className="w-5 h-5 mr-3" /> GitHub Profile
                          </a>
                        </div>
                      </div>
                    ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-5xl">
                    {teamMembers
                      .filter((member) => member.position !== "center")
                      .map((member, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                        >
                          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-800 rounded-t-2xl">
                            <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                              <div className="w-35 h-35 rounded-full bg-white p-1 border-4 border-blue-300">
                                <img
                                  src={member.avatar}
                                  alt={`${member.name}'s avatar`}
                                  className="w-full h-full rounded-full object-cover"
                                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                />
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-20 rounded-t-full"></div>
                          </div>
                          <div className="pt-20 px-6 pb-8 text-center">
                            <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                            <p className="text-blue-600 text-base font-medium mb-4">{member.role}</p>
                            <div className="space-y-3 mb-6">
                              <div className="flex items-start justify-center">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-1 mr-3">
                                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                </div>
                                <p className="text-base text-gray-600">{member.expertise}</p>
                              </div>
                              <div className="flex items-start justify-center">
                               
                              </div>
                            </div>
                            <a
                              href={member.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-base shadow-sm"
                            >
                              <Github className="w-4 h-4 mr-2" /> GitHub Profile
                            </a>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-20 text-center">
                  <h3 className="text-3xl font-bold mb-6 text-gray-800">Get in Touch</h3>
                  <p className="text-xl text-gray-600 mb-8">
                    Have questions about NEU OJT-Link or interested in collaborating with our team?
                  </p>
                  <a
                    href="https://www.linkedin.com/in/juliana-mancera-84947b309/"
                    className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md"
                    style={{ color: 'white' }}
                  >
                    Contact Our Team Lead
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slide-in-down {
            0% {
              opacity: 0;
              transform: translateY(-20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slide-in-down {
            animation: slide-in-down 0.3s ease-out forwards;
          }
          @keyframes fade-in {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          .animate-fade-in {
            animation: fade-in 0.4s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default AboutUs;