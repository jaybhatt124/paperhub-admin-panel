// ===== PAPERHUB DATA =====
// Replace drive links with your actual Google Drive links

const DATA = {
  boards: {
    CBSE: {
      name: "CBSE",
      icon: "🇮🇳",
      classes: {
        "10th": {
          subjects: ["Maths","Science","Social Science","English","Hindi","Sanskrit"]
        },
        "12th": {
          streams: {
            "Science": ["Physics","Chemistry","Maths","Biology","English","Computer Science"],
            "Commerce": ["Accountancy","Economics","Business Studies","English","Maths"],
            "Arts": ["History","Geography","Political Science","English","Sociology","Psychology"]
          }
        }
      }
    },
    GSEB: {
      name: "GSEB",
      icon: "🏫",
      classes: {
        "10th": {
          subjects: ["Maths","Science","Social Science","English","Hindi","Gujarati","Sanskrit"]
        },
        "12th": {
          streams: {
            "Science": ["Physics","Chemistry","Maths","Biology","English"],
            "Commerce": ["Accountancy","Economics","Business Studies","English","Statistics"],
            "Arts": ["History","Geography","Political Science","English","Gujarati","Sociology"]
          }
        }
      }
    },
    GTU: {
      name: "GTU Diploma",
      icon: "🎓",
      branches: {
        "Computer Engineering": {
          semesters: {
            "Semester 1": ["Maths-1","Physics","Basic Electronics","Communication Skills","Engineering Drawing"],
            "Semester 2": ["Maths-2","Chemistry","Basic Electrical","C Programming","Workshop"],
            "Semester 3": ["Data Structures","Digital Electronics","OOP with C++","Computer Organization","Maths-3"],
            "Semester 4": ["Database Management","Operating Systems","Java Programming","Computer Networks","Software Engineering"],
            "Semester 5": ["Web Technology","Python Programming","Mobile App Development","Cyber Security","Project-1"],
            "Semester 6": ["Cloud Computing","Machine Learning","Big Data","Project-2","Professional Ethics"]
          }
        },
        "Mechanical Engineering": {
          semesters: {
            "Semester 1": ["Maths-1","Physics","Engineering Drawing","Workshop","Communication Skills"],
            "Semester 2": ["Maths-2","Chemistry","Basic Electrical","C Programming","Material Science"],
            "Semester 3": ["Thermodynamics","Fluid Mechanics","Manufacturing Processes","Maths-3","Metrology"],
            "Semester 4": ["Machine Design","Heat Transfer","CAD/CAM","Industrial Engineering","Strength of Materials"],
            "Semester 5": ["Automobile Engineering","Refrigeration","CNC Technology","Project-1","Mechatronics"],
            "Semester 6": ["Power Plant","Quality Control","Project-2","Robotics","Professional Ethics"]
          }
        },
        "Civil Engineering": {
          semesters: {
            "Semester 1": ["Maths-1","Physics","Engineering Drawing","Surveying","Communication Skills"],
            "Semester 2": ["Maths-2","Chemistry","Basic Electrical","Building Materials","Workshop"],
            "Semester 3": ["Strength of Materials","Fluid Mechanics","Surveying-2","Maths-3","Concrete Technology"],
            "Semester 4": ["Structural Analysis","Soil Mechanics","Transportation Engineering","Water Supply","Estimating"],
            "Semester 5": ["RCC Design","Foundation Engineering","Irrigation","Project-1","Environmental Engineering"],
            "Semester 6": ["Steel Design","Construction Management","Project-2","Town Planning","Professional Ethics"]
          }
        },
        "Electrical Engineering": {
          semesters: {
            "Semester 1": ["Maths-1","Physics","Basic Electronics","Communication Skills","Engineering Drawing"],
            "Semester 2": ["Maths-2","Chemistry","C Programming","Workshop","Electrical Materials"],
            "Semester 3": ["Electrical Machines-1","Circuit Theory","Maths-3","Power Systems","Measurement"],
            "Semester 4": ["Electrical Machines-2","Control Systems","Power Electronics","Switchgear","Utilization"],
            "Semester 5": ["Industrial Drives","PLC","Project-1","Renewable Energy","Instrumentation"],
            "Semester 6": ["High Voltage","Power System Protection","Project-2","Energy Management","Professional Ethics"]
          }
        },
        "Electronics & Communication": {
          semesters: {
            "Semester 1": ["Maths-1","Physics","Basic Electronics","Communication Skills","Engineering Drawing"],
            "Semester 2": ["Maths-2","Chemistry","C Programming","Workshop","Digital Electronics"],
            "Semester 3": ["Analog Electronics","Signals & Systems","Maths-3","Microprocessor","Communication Theory"],
            "Semester 4": ["Digital Communication","Embedded Systems","Control Systems","VLSI","Antenna Theory"],
            "Semester 5": ["Wireless Communication","DSP","Project-1","Optical Fiber","Satellite Communication"],
            "Semester 6": ["Mobile Communication","IoT","Project-2","Advanced Communication","Professional Ethics"]
          }
        },
        "Information Technology": {
          semesters: {
            "Semester 1": ["Maths-1","Physics","Basic Electronics","Communication Skills","Engineering Drawing"],
            "Semester 2": ["Maths-2","Chemistry","C Programming","Workshop","Basic Networking"],
            "Semester 3": ["Data Structures","Digital Electronics","OOP with Java","Maths-3","Computer Networks"],
            "Semester 4": ["Database Management","Web Development","Operating Systems","Software Engineering","Android Development"],
            "Semester 5": ["Cloud Computing","Cyber Security","Project-1","Python","Data Analytics"],
            "Semester 6": ["Machine Learning","IoT","Project-2","DevOps","Professional Ethics"]
          }
        }
      }
    }
  }
};

// ===== PAPER DATABASE =====
// Add your papers here with Google Drive links
// Format: { id, board, class, branch, stream, semester, subject, year, title, view_link, download_link }

let PAPERS = [
  // CBSE 10th Sample Papers
  {
    id: 1, board: "CBSE", class: "10th", subject: "Maths",
    year: "2024", title: "CBSE 10th Maths Board Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 2, board: "CBSE", class: "10th", subject: "Science",
    year: "2024", title: "CBSE 10th Science Board Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 3, board: "CBSE", class: "10th", subject: "Maths",
    year: "2023", title: "CBSE 10th Maths Board Paper 2023",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 4, board: "CBSE", class: "10th", subject: "Social Science",
    year: "2024", title: "CBSE 10th Social Science Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  // CBSE 12th
  {
    id: 5, board: "CBSE", class: "12th", stream: "Science", subject: "Physics",
    year: "2024", title: "CBSE 12th Physics Board Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 6, board: "CBSE", class: "12th", stream: "Science", subject: "Chemistry",
    year: "2024", title: "CBSE 12th Chemistry Board Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  // GSEB 10th
  {
    id: 7, board: "GSEB", class: "10th", subject: "Maths",
    year: "2024", title: "GSEB 10th Maths Board Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 8, board: "GSEB", class: "10th", subject: "Science",
    year: "2024", title: "GSEB 10th Science Board Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 9, board: "GSEB", class: "10th", subject: "Gujarati",
    year: "2024", title: "GSEB 10th Gujarati Board Paper 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  // GTU Diploma
  {
    id: 10, board: "GTU", class: "Diploma",
    branch: "Computer Engineering", semester: "Semester 3", subject: "Data Structures",
    year: "2024", title: "GTU Data Structures Winter 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 11, board: "GTU", class: "Diploma",
    branch: "Computer Engineering", semester: "Semester 3", subject: "Data Structures",
    year: "2023", title: "GTU Data Structures Summer 2023",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  },
  {
    id: 12, board: "GTU", class: "Diploma",
    branch: "Computer Engineering", semester: "Semester 4", subject: "Database Management",
    year: "2024", title: "GTU DBMS Winter 2024",
    view_link: "https://drive.google.com/file/d/SAMPLE_ID/view",
    download_link: "https://drive.google.com/uc?export=download&id=SAMPLE_ID"
  }
];

// Load papers from localStorage (admin added)
function loadPapers() {
  const saved = localStorage.getItem('ph_papers');
  if (saved) {
    try { PAPERS = JSON.parse(saved); } catch(e) {}
  }
}

function savePapers() {
  localStorage.setItem('ph_papers', JSON.stringify(PAPERS));
}

loadPapers();
