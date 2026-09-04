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

      finance:"Finance Settings",

      penaltyLabel:"Monthly Late Penalty",

      penaltyHint:
      "This amount is charged monthly for late payments.",


      appearance:"Appearance",

      darkMode:"Dark Mode",

      langLabel:"Language",


      security:"Security",

      changePass:"Change Admin Password",

      logout:"Logout",


      about:"About System",

      mission:"Mission",

      missionText:
      "Providing efficient financial management systems for micro-finance institutions.",


      version:"System Version",

      devInfo:"Developer",

      developer:"Teklu Abebe",

      pro:"Full Stack Software Engineer"


    },



    Amharic:{


      title:"የሲስተም ቅንብሮች",


      finance:"የፋይናንስ ቅንብሮች",


      penaltyLabel:"የወር ውዝፍ ቅጣት",


      penaltyHint:
      "ይህ ዋጋ በወር የሚታሰብ ቅጣት ነው።",


      appearance:"የገጽታ ቅንብሮች",


      darkMode:"Dark Mode",


      langLabel:"ቋንቋ",


      security:"ደህንነት",


      changePass:"ፓስዎርድ ቀይር",


      logout:"ውጣ",


      about:"ስለ ሲስተሙ",


      mission:"ተልዕኮ",


      missionText:
      "ዘመናዊ የፋይናንስ አስተዳደር ሲስተም ማቅረብ።",


      version:"ስሪት",


      devInfo:"አልሚ",


      developer:"ተክሉ አበበ",


      pro:"Full Stack Software Engineer"


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
            Configure system preferences and personalization.
          </p>


        </div>


      </div>



      <div className="settings-grid">



        {/* GENERAL SETTINGS */}


        <div className="settings-glass-card settings-large-card">


          <div className="settings-card-title">


            <FaUserCog/>


            <h3>
              General Settings
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
              Notifications
            </h3>


          </div>




          <div className="settings-toggle-item">


            <div>


              <h4>
                Email Alerts
              </h4>


              <p>
                Receive system emails
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
                Loan Requests
              </h4>


              <p>
                Receive loan request notifications
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
    <h4>Withdrawal Requests</h4>
    <p>Receive withdrawal request notifications</p>
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
                Password Reset
              </h4>


              <p>
                Notify when password reset is requested
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
                  Switch between light and dark appearance
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
                Version 1.0.4
              </p>


              <small>
                Stable Release
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