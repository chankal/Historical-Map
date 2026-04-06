import johnWesleyDobbs from "../images/john_wesley_dobbs.png";
import johnLewis from "../images/john_lewis.jpg";
import hermanRussell from "../images/herman_russell.png";

const LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
];

function threeStops(address, lat, lng) {
  return [0, 1, 2].map((i) => ({
    address,
    spot_blurb: LOREM[i],
    lat,
    lng,
  }));
}

const fallbackData = [
  {
    id: 1,
    name: "John Wesley Dobbs",
    slug: "john-wesley-dobbs",
    stops: threeStops(
      "309 Auburn Ave NE, Atlanta, GA 30303",
      33.755343636987824,
      -84.3778733190625
    ),
    details: {
      blurb: "Voting Rights Advocate & Grandfather of Maynard Jackson",
      address: "309 Auburn Ave NE, Atlanta, GA 30303",
      obituary: "",
      description:
        "Often referred to as the unofficial mayor of Auburn Avenue, Dobbs coined the term 'Sweet Auburn,' an expression of the area's thriving businesses and active social and civic life. Dobbs was a member of the Prince Hall Masons. The broken column on his gravesite indicates that he held the office of Grand Master until his death. It also contains the masonic symbol. In the 1930s and 40s Dobbs helped establish the Atlanta Civic and Political League, the Atlanta Negro Voters League, and the Georgia Voters League. In the 1940s, he led a voter registration drive that was considered the birth of Atlanta's modern Civil Rights Era. He was instrumental in the desegregation of the Atlanta police department when eight black men joined the force in 1948. They used the Butler Street YMCA as their precinct. These early officers were not allowed to wear their uniforms to and from work, and they only patrolled black sections of the city, on foot. They were not allowed to drive squad cars or arrest white Americans.",
    },
    image: johnWesleyDobbs,
    latLng: { lat: 33.755343636987824, lng: -84.3778733190625 },
  },
  {
    id: 2,
    name: "John Lewis",
    slug: "john-lewis",
    stops: threeStops(
      "350 Ferst Dr NW, Atlanta, GA 30332",
      33.77382557301242,
      -84.39923578659527
    ),
    details: {
      blurb: "Civil Rights Leader, US Congressman",
      address: "350 Ferst Dr NW, Atlanta, GA 30332",
      obituary: "https://en.wikipedia.org/wiki/John_Lewis",
      description:
        "American politician and civil rights activist who served in the United States House of Representatives for Georgia's 5th congressional district from 1987 until his death in 2020. He participated in the 1960 Nashville sit-ins, the Freedom Rides, was the chairman of the Student Nonviolent Coordinating Committee (SNCC) from 1963 to 1966, and was one of the \"Big Six\" leaders of groups who organized the 1963 March on Washington.",
    },
    image: johnLewis,
    latLng: { lat: 33.77382557301242, lng: -84.39923578659527 },
  },
  {
    id: 3,
    name: "Herman J. Russell",
    slug: "herman-j-russell",
    stops: threeStops(
      "765 Peeples St SW, Atlanta, GA 30310",
      33.73343240840232,
      -84.42143672513741
    ),
    details: {
      blurb: "Entrepreneur, Civil Rights Advocate",
      address: "765 Peeples St SW, Atlanta, GA 30310",
      obituary: "",
      description:
        "In 1963, Russell became the first black member, and later president, of the Atlanta Chamber of Commerce. He also played a leading role in the modern Civil Rights Movement working very closely with Rev. Martin Luther King, Jr. Russell has served also as a board member for civic organizations like the Allen Temple; Butler Street YMCA; Central Atlanta Progress; Tuskegee University; the NAACP Atlanta chapter; Citizens Trust Bank; Midtown Improvement District and the Georgia State University Advisory Board. An avid supporter of Atlanta and its youth, Russell is the founder of the Herman J. Russell Entrepreneurial Scholarship Foundation for an Atlanta elementary school. Among his recognition awards are induction into the Junior Achievement Atlanta Business Hall of Fame in 1992, and recipient of the Horatio Alger Award in 1991. He and his wife, Otelia, lived in midtown Atlanta. They are the parents of two sons and a daughter, who are executives with H. J. Russell Co.",
    },
    image: hermanRussell,
    latLng: { lat: 33.73343240840232, lng: -84.42143672513741 },
  },
];

export default fallbackData;
