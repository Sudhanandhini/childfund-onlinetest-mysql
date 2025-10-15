export const indianStates = [
  {
    state: "Tamil Nadu",
    districts: [
      "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram",
      "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal",
      "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga",
      "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
      "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
    ]
  },
  {
    state: "Kerala",
    districts: [
      "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
      "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram",
      "Thrissur", "Wayanad"
    ]
  },
  {
    state: "Karnataka",
    districts: [
      "Bagalkot", "Bangalore Rural", "Bangalore Urban", "Belgaum", "Bellary", "Bidar",
      "Bijapur", "Chamarajanagar", "Chickmagalur", "Chikkaballapur", "Chitradurga",
      "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Gulbarga", "Hassan",
      "Haveri", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysore", "Raichur", "Ramanagara",
      "Shimoga", "Tumkur", "Udupi", "Uttara Kannada", "Yadgir"
    ]
  },
  {
    state: "Andhra Pradesh",
    districts: [
      "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool",
      "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam",
      "Vizianagaram", "West Godavari", "YSR District, Kadapa"
    ]
  },
  {
    state: "Maharashtra",
    districts: [
      "Mumbai City", "Mumbai Suburban", "Thane", "Palghar", "Raigad", "Ratnagiri", 
      "Sindhudurg", "Nashik", "Dhule", "Nandurbar", "Jalgaon", "Ahmednagar", 
      "Pune", "Satara", "Sangli", "Solapur", "Kolhapur", "Aurangabad", "Beed", 
      "Nanded", "Osmanabad", "Latur", "Amravati", "Akola", "Washim", "Buldhana", 
      "Yavatmal", "Wardha", "Nagpur", "Bhandara", "Gondia", "Chandrapur", "Gadchiroli",
      "Parbhani", "Hingoli"
    ]
  },
  {
    state: "Goa",
    districts: [
      "North Goa", "South Goa"
    ]
  }
];

export const getDistricts = (state) => {
  const stateObj = indianStates.find(s => s.state === state);
  return stateObj ? stateObj.districts : [];
};