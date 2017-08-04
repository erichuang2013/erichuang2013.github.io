var links = ["https://www.rcplanet.com/68019/Traxxas_Slash_1_10_2WD_Short_Course_Truck_RTR_iD_T.jpg",

"http://www.towerhobbies.com/products/traxxas/trad27/trad27br_550.jpg",

"http://www.3dprinterprices.net/wp-content/uploads/2015/11/Q450-quadcopter-kopen.jpg",

"http://www.beastsofwar.com/wp-content/uploads/2015/03/3D-Printed-Skull.jpg",
             "https://2.bp.blogspot.com/-h41iiQr_AIw/VgFPtnvb9bI/AAAAAAAAEdE/73YW-pem2U8/s1600/Python3-powered_hello-world.png",
             "https://uploads.scratch.mit.edu/users/avatars/1771/7339.png",
             "http://d1s8mqgwixvb29.cloudfront.net/article/article_extra_large_image/1468824468_Wf8CWa_AI.jpg"
];

var titles = ["Traxxas Slash 4X4 遙控車", "Traxxas Bandit 2wd 遙控車", "四軸直昇機", "3D設計及列印", "Python程式設計", "Scratch兒童程式教學", "AI人工智慧"];
var index = 0;
var autoplay = false;

function prevPic() {
  
}
function nextPic() {
  console.log("nextPic: " + index);
  var img = document.getElementById("pic");
  index++;
  img.src = links[index % links.length];
  
  var title = document.getElementById("title");
  title.innerHTML = titles[index % links.length];
  console.log(title);
  
  if(autoplay) {
    setTimeout(nextPic, 3000);
  }
}

if(autoplay) {
    setTimeout(nextPic, 3000);
}
