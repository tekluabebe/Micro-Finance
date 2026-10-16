import React, { useEffect, useState } from "react";
import "./SettingsPage.css";

import {
  FaCog,
  FaUserShield,
  FaPercentage,
  FaInfoCircle,
  FaHistory,
  FaGlobe,
  FaCode,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaBell,
  FaUserCog,
  FaShieldAlt,
  FaPaintBrush
} from "react-icons/fa";

import { useAppContext } from "../pages/context";


export default function SettingsPage() {


  const { 
    darkMode, 
    setDarkMode, 
    language, 
    setLanguage 
  } = useAppContext();

const getNotificationPreference = (key, defaultValue = true) =>
  localStorage.getItem(key) === null
    ? defaultValue
    : localStorage.getItem(key) === "true";

  const [penalty,setPenalty] = useState(50);


 const [emailNotification, setEmailNotification] = useState(() =>
    getNotificationPreference("emailNotification")
  );

  const [loanNotification, setLoanNotification] = useState(() =>
    getNotificationPreference("loanNotification")
  );

  const [passwordNotification, setPasswordNotification] = useState(() =>
    getNotificationPreference("passwordNotification")
  );

  const [withdrawalNotification, setWithdrawalNotification] = useState(() =>
    getNotificationPreference("withdrawalNotification")
  );

  useEffect(() => {
    localStorage.setItem("emailNotification", emailNotification);
    localStorage.setItem("loanNotification", loanNotification);
    localStorage.setItem("passwordNotification", passwordNotification);
    localStorage.setItem("withdrawalNotification", withdrawalNotification);
  }, [
      emailNotification,
    loanNotification,
    passwordNotification,
    withdrawalNotification,
  ]);


  const texts = {


    English:{


      title:"System Settings",

      intro:"Configure system preferences and personalization.",

      finance:"Finance Settings",

      general:"General Settings",

      penaltyLabel:"Monthly Late Penalty",

      penaltyHint:
      "This amount is charged monthly for late payments.",


      appearance:"Appearance",

      darkMode:"Dark Mode",

      appearanceHint:"Switch between light and dark appearance",

      langLabel:"Language",


      security:"Security",

      changePass:"Change Admin Password",

      logout:"Logout",

      notifications:"Notifications",

      emailAlerts:"Email Alerts",

      receiveEmails:"Receive system emails",

      loanRequests:"Loan Requests",

      receiveLoanRequests:"Receive loan request notifications",

      withdrawalRequests:"Withdrawal Requests",

      receiveWithdrawals:"Receive withdrawal request notifications",

      passwordReset:"Password Reset",

      receivePasswordResets:"Notify when password reset is requested",


      about:"About System",

      mission:"Mission",

      missionText:
      "Providing efficient financial management systems for micro-finance institutions.",


      version:"System Version",

      versionNumber:"Version 1.0.4",

      release:"Stable Release",

      devInfo:"Developer",

      developer:"Teklu Abebe",

      pro:"Full Stack Software Engineer"


    },



    Amharic:{


      title:"የሲስተም ቅንብሮች",

      intro:"የሲስተሙን ምርጫዎች እና ግላዊ ቅንብሮች ያስተካክሉ።",


      finance:"የፋይናንስ ቅንብሮች",

      general:"አጠቃላይ ቅንብሮች",


      penaltyLabel:"የወር ውዝፍ ቅጣት",


      penaltyHint:
      "ይህ ዋጋ በወር የሚታሰብ ቅጣት ነው።",


      appearance:"የገጽታ ቅንብሮች",


      darkMode:"ጨለማ ገጽታ",

      appearanceHint:"በብርሃን እና በጨለማ ገጽታ መካከል ይቀያይሩ።",


      langLabel:"ቋንቋ",


      security:"ደህንነት",


      changePass:"ፓስዎርድ ቀይር",


      logout:"ውጣ",

      notifications:"ማሳወቂያዎች",

      emailAlerts:"የኢሜይል ማሳወቂያዎች",

      receiveEmails:"የሲስተሙን ኢሜይሎች ተቀበል",

      loanRequests:"የብድር ጥያቄዎች",

      receiveLoanRequests:"ስለ ብድር ጥያቄዎች ማሳወቂያ ተቀበል",

      withdrawalRequests:"የገንዘብ ማውጣት ጥያቄዎች",

      receiveWithdrawals:"ስለ ገንዘብ ማውጣት ጥያቄዎች ማሳወቂያ ተቀበል",

      passwordReset:"የይለፍ ቃል ዳግም ማስጀመር",

      receivePasswordResets:"የይለፍ ቃል ዳግም ማስጀመር ሲጠየቅ አሳውቅ",


      about:"ስለ ሲስተሙ",


      mission:"ተልዕኮ",


      missionText:
      "ዘመናዊ የፋይናንስ አስተዳደር ሲስተም ማቅረብ።",


      version:"ስሪት",

      versionNumber:"ስሪት 1.0.4",

      release:"የተረጋጋ ልቀት",


      devInfo:"አልሚ",


      developer:"ተክሉ አበበ",


      pro:"ሙሉ ስታክ ሶፍትዌር መሐንዲስ"


    },

    Oromiffa:{
      title:"Sajoo Sirnaa",
      intro:"Filannoo sirnaa fi dhuunfaa qindeessaa.",
      finance:"Sajoo Faayinaansii",
      general:"Sajoo Waliigalaa",
      penaltyLabel:"Adabbii Ji'a Ji'aan",
      penaltyHint:"Maallaqni kun kaffaltii yeroo isaa darbeef ji'a ji'aan kaffalama.",
      appearance:"Bifa",
      darkMode:"Bifa Dukkanaa",
      appearanceHint:"Bifa ifaa fi dukkanaa gidduutti jijjiiri.",
      langLabel:"Afaan",
      security:"Nageenya",
      changePass:"Jecha Darbii Bulchaa Jijjiiri",
      logout:"Ba'i",
      notifications:"Beeksisawwan",
      emailAlerts:"Beeksisa Imeelii",
      receiveEmails:"Imeeliiwwan sirnaa fudhadhu",
      loanRequests:"Gaaffii Liqii",
      receiveLoanRequests:"Beeksisa gaaffii liqii fudhadhu",
      withdrawalRequests:"Gaaffii Maallaqa Baasuu",
      receiveWithdrawals:"Beeksisa gaaffii maallaqa baasuu fudhadhu",
      passwordReset:"Jecha Darbii Haaromsuu",
      receivePasswordResets:"Yeroo jechi darbii haaromfamu beeksisi",
      about:"Waa'ee Sirnichaa",
      mission:"Kaayyoo",
      missionText:"Dhaabbilee maayikiroo faayinaansiif sirna bulchiinsa faayinaansii bu'a qabeessa dhiyeessuu.",
      version:"Gosa Sirnaa",
      versionNumber:"Gosa 1.0.4",
      release:"Gosa tasgabbaa'aa",
      devInfo:"Misraachoo",
      developer:"Teklu Abebe",
      pro:"Injinarri Sooftiweerii Full Stack"
    },

    Tigrigna:{
      title:"ቅንብራት ስርዓት",
      intro:"ምርጫታት ስርዓትን ናይ ባዕልኻ ቅንብራትን ኣስተኻኽል።",
      finance:"ቅንብራት ፋይናንስ",
      general:"ሓፈሻዊ ቅንብራት",
      penaltyLabel:"ወርሓዊ መቕጻዕቲ ውዑል ክፍሊት",
      penaltyHint:"እዚ መጠን ንዝደንጎየ ክፍሊት ብወርሒ ይኽፈል።",
      appearance:"መልክዕ",
      darkMode:"ጸልማት መልክዕ",
      appearanceHint:"ኣብ ብሩህን ጸልማትን መልክዕ ቀያይር።",
      langLabel:"ቋንቋ",
      security:"ድሕንነት",
      changePass:"ናይ ኣስተዳዳሪ መሕለፊ ቃል ቀይር",
      logout:"ውጻእ",
      notifications:"ሓበሬታታት",
      emailAlerts:"ናይ ኢመይል ሓበሬታ",
      receiveEmails:"ናይ ስርዓት ኢመይላት ተቐበል",
      loanRequests:"ሕቶታት ልቓሕ",
      receiveLoanRequests:"ሓበሬታ ሕቶ ልቓሕ ተቐበል",
      withdrawalRequests:"ሕቶታት ምውጻእ ገንዘብ",
      receiveWithdrawals:"ሓበሬታ ሕቶ ምውጻእ ገንዘብ ተቐበል",
      passwordReset:"ዳግማይ ምምሕያሽ መሕለፊ ቃል",
      receivePasswordResets:"መሕለፊ ቃል ክምሓየሽ እንከሎ ኣፍልጥ",
      about:"ብዛዕባ እቲ ስርዓት",
      mission:"ዕላማ",
      missionText:"ንትካላት ማይክሮ ፋይናንስ ውጽኢታዊ ስርዓት ምምሕዳር ፋይናንስ ምቕራብ።",
      version:"ስሪት ስርዓት",
      versionNumber:"ስሪት 1.0.4",
      release:"ዝተረጋገጸ ልቀት",
      devInfo:"ኣማዕባሊ",
      developer:"ተክሉ ኣበበ",
      pro:"Full Stack ኢንጂነር ሶፍትዌር"
    }


  };



  const t = texts[language] || texts.English;



  const handleLogout =()=>{


    localStorage.clear();


    window.dispatchEvent(
      new Event("storage")
    );


    window.location.href="/login";


  };



  return (

    <div
      className={
        darkMode
        ?
        "settings-page dark"
        :
        "settings-page light"
      }
    >



      <div className="settings-page-header">


        <div>


          <h1>

            <FaCog/>

            {t.title}

          </h1>


          <p>
            {t.intro}
          </p>


        </div>


      </div>



      <div className="settings-grid">



        {/* GENERAL SETTINGS */}


        <div className="settings-glass-card settings-large-card">


          <div className="settings-card-title">


            <FaUserCog/>


            <h3>
              {t.general}
            </h3>


          </div>




          <div className="settings-input-group">


            <label>

              <FaPercentage/>

              {t.penaltyLabel}

            </label>



            <input

              type="number"

              value={penalty}

              onChange={
                (e)=>
                setPenalty(e.target.value)
              }

            />


            <span className="settings-hint">

              {t.penaltyHint}

            </span>


          </div>




          <div className="settings-input-group">


            <label>

              <FaGlobe/>

              {t.langLabel}

            </label>



            <select

              value={language}

              onChange={
                (e)=>
                setLanguage(e.target.value)
              }

            >

              <option value="English">
                English
              </option>


              <option value="Amharic">
                አማርኛ
              </option>


              <option value="Oromiffa">
                Afaan Oromoo
              </option>


              <option value="Tigrigna">
                ትግርኛ
              </option>


            </select>


          </div>


        </div>
                {/* ===========================
            NOTIFICATIONS
        =========================== */}


        <div className="settings-glass-card">


          <div className="settings-card-title">


            <FaBell/>


            <h3>
              {t.notifications}
            </h3>


          </div>




          <div className="settings-toggle-item">


            <div>


              <h4>
                {t.emailAlerts}
              </h4>


              <p>
                {t.receiveEmails}
              </p>


            </div>



            <label className="settings-switch">


              <input

                type="checkbox"

                checked={emailNotification}

                onChange={() =>
                  setEmailNotification(
                    !emailNotification
                  )
                }

              />


              <span className="settings-slider"></span>


            </label>


          </div>





          <div className="settings-toggle-item">


            <div>


              <h4>
                {t.loanRequests}
              </h4>


              <p>
                {t.receiveLoanRequests}
              </p>


            </div>



            <label className="settings-switch">


              <input

                type="checkbox"

                checked={loanNotification}

                onChange={() =>
                  setLoanNotification(
                    !loanNotification
                  )
                }

              />


              <span className="settings-slider"></span>


            </label>


          </div>

      <div className="settings-toggle-item">
  <div>
    <h4>{t.withdrawalRequests}</h4>
    <p>{t.receiveWithdrawals}</p>
  </div>

  <label className="settings-switch">
    <input
      type="checkbox"
      checked={withdrawalNotification}
      onChange={() =>
        setWithdrawalNotification((current) => !current)
      }
    />
    <span className="settings-slider"></span>
  </label>
</div>



          <div className="settings-toggle-item">


            <div>


              <h4>
                {t.passwordReset}
              </h4>


              <p>
                {t.receivePasswordResets}
              </p>


            </div>



            <label className="settings-switch">


              <input

                type="checkbox"

                checked={passwordNotification}

                onChange={() =>
                  setPasswordNotification(
                    !passwordNotification
                  )
                }

              />


              <span className="settings-slider"></span>


            </label>


          </div>



        </div>





        {/* ===========================
            APPEARANCE
        =========================== */}



        <div className="settings-glass-card">



          <div className="settings-card-title">


            <FaPaintBrush/>


            <h3>
              {t.appearance}
            </h3>


          </div>





          <div className="settings-theme-box">



            <div className="settings-theme-info">


              {
                darkMode ?

                <FaMoon className="settings-theme-icon settings-moon"/>

                :

                <FaSun className="settings-theme-icon settings-sun"/>

              }




              <div>


                <h4>
                  {t.darkMode}
                </h4>


                <p>
                  {t.appearanceHint}
                </p>


              </div>


            </div>





            <label className="settings-switch">


              <input

                type="checkbox"

                checked={darkMode}

                onChange={() =>
                  setDarkMode(!darkMode)
                }

              />


              <span className="settings-slider"></span>


            </label>



          </div>





          <div className="settings-color-palette">


            <span className="settings-color settings-blue"></span>


            <span className="settings-color settings-cyan"></span>


            <span className="settings-color settings-purple"></span>


            <span className="settings-color settings-pink"></span>


            <span className="settings-color settings-green"></span>


          </div>



        </div>






        {/* ===========================
            SECURITY
        =========================== */}



        <div className="settings-glass-card">



          <div className="settings-card-title">


            <FaShieldAlt/>


            <h3>
              {t.security}
            </h3>


          </div>





          <button className="settings-primary-btn">


            <FaUserShield/>


            {t.changePass}


          </button>





          <button

            className="settings-logout-btn"

            onClick={handleLogout}

          >


            <FaSignOutAlt/>


            {t.logout}


          </button>




        </div>







        {/* ===========================
            ABOUT
        =========================== */}



        <div className="settings-glass-card settings-full-width">



          <div className="settings-card-title">


            <FaInfoCircle/>


            <h3>
              {t.about}
            </h3>


          </div>





          <div className="settings-about-grid">





            <div className="settings-about-box">


              <FaGlobe className="settings-about-icon"/>


              <h4>
                {t.mission}
              </h4>


              <p>
                {t.missionText}
              </p>


            </div>







            <div className="settings-about-box">


              <FaHistory className="settings-about-icon"/>


              <h4>
                {t.version}
              </h4>


              <p>
                {t.versionNumber}
              </p>


              <small>
                {t.release}
              </small>


            </div>








            <div className="settings-about-box">


              <FaCode className="settings-about-icon"/>


              <h4>
                {t.devInfo}
              </h4>


              <p>
                {t.developer}
              </p>


              <small>
                {t.pro}
              </small>


            </div>





          </div>



        </div>




      </div>


    </div>

  );


}