import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useAppContext } from "./context";
import { translate } from "../utils/translations";
import {
  FaBullhorn,
  FaBookOpen,
  FaCog,
  FaRegSmile,
  FaShieldAlt,
  FaHeadset,
  FaClock,
  FaSearch,
  FaKeyboard,
  FaQuestionCircle,
  FaInfoCircle,
    FaGoogle,
  FaPaperPlane,
  FaTimes,
} from "react-icons/fa";

export default function HelpPage({ isSidebarOpen = true }) {
  const { language } = useAppContext();
  const t = (text) => translate(language, text);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
const [supportMode, setSupportMode] = useState("login");
const [supportUser, setSupportUser] = useState(null);
const [supportRequests, setSupportRequests] = useState([]);
const [supportResponses, setSupportResponses] = useState([]);
const [showRequestsList, setShowRequestsList] = useState(false);
const [showResponsesList, setShowResponsesList] = useState(false);
const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
const [unreadResponsesCount, setUnreadResponsesCount] = useState(0);
const [responseText, setResponseText] = useState("");
const [selectedRequestId, setSelectedRequestId] = useState(null);
 const [isAdmin, setIsAdmin] = useState(false); 
const [supportForm, setSupportForm] = useState({
  name: "",
  email: "",
  password: "",
  recipientEmail: "",
  question: "",
});

// Delete these lines from their current location:
const isNotificationEnabled = (key) =>
  localStorage.getItem(key) !== "false";

const supportNotificationEnabled =
  isNotificationEnabled("emailNotification");

// (or wherever you handle login)

const handleLogin = async (e) => {
  e.preventDefault();
  
  try {
    const { data } = await API.post("/auth/login", {
      memberId,
      password,
      role
    });

    if (data.success) {
      // 🔥 Save userRole to localStorage
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("memberId", data.user.memberId);
      localStorage.setItem("fullName", data.user.fullName);
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
    }
  } catch (err) {
    alert(err.response?.data?.message || t("Login failed"));
  }
};
const [sendingRequest, setSendingRequest] = useState(false);

const handleSupportChange = (e) => {
  setSupportForm((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};



const handleSupportAuth = async (e) => {
  e.preventDefault();

  try {
    const endpoint =
      supportMode === "login"
        ? "/support/auth/login"
        : "/support/auth/register";

    const { data } = await API.post(endpoint, {
      name: supportForm.name,
      email: supportForm.email,
      password: supportForm.password,
    });

    // 🔥 Save supportUser to localStorage
    localStorage.setItem("supportToken", data.token);
    localStorage.setItem("supportUser", JSON.stringify(data.user || data));
    
    setSupportUser(data.user || data);
    
    alert(
      supportMode === "login"
        ? t("Support account login successful.")
        : t("Support account created successfully.")
    );
  } catch (error) {
    console.error("Support request error:", error.response?.data || error);
    alert(
      error.response?.data?.message ||
      "Unable to process support request."
    );
  }
};

const handleGoogleLogin = () => {
  window.location.href = `${API.defaults.baseURL}/support/auth/google`;
};

const handleSendSupportRequest = async (e) => {
  e.preventDefault();

  if (!supportForm.recipientEmail || !supportForm.question.trim()) {
    alert(t("Please enter the recipient email and your question."));
    return;
  }

  setSendingRequest(true);

  try {
await API.post(
  "/support/requests",
  {
    recipientEmail: supportForm.recipientEmail,
    question: supportForm.question,
  },
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("supportToken")}`,
    },
  }
);

    alert(t("Your support request was sent successfully."));

    setSupportForm((prev) => ({
      ...prev,
      question: "",
    }));

    setShowSupportModal(false);
  } catch (error) {
    alert(
      error.response?.data?.message ||
        t("Unable to send the support request.")
    );
  } finally {
    setSendingRequest(false);
  }
};

useEffect(() => {
  const userRole = localStorage.getItem("userRole");
  console.log("🔍 DEBUG - userRole from localStorage:", userRole);
  console.log("🔍 DEBUG - isAdmin will be:", userRole?.toLowerCase() === "admin");
  
  setIsAdmin(userRole?.toLowerCase() === "admin");
}, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

    useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    console.log("📌 User Role from localStorage:", userRole); // Debug log
    setIsAdmin(userRole?.toLowerCase() === "admin");
  }, []);


useEffect(() => {
  if (!isAdmin || !supportNotificationEnabled) {
    setSupportRequests([]);
    setUnreadRequestsCount(0);
    return;
  }

  fetch(`${process.env.REACT_APP_API_URL}/api/support/requests/admin/all`)
    .then((res) => res.json())
    .then((data) => {
      setSupportRequests(Array.isArray(data) ? data : []);
      setUnreadRequestsCount(Array.isArray(data) ? data.length : 0);
    })
    .catch((err) => {
      console.error("Support request notification error:", err);
      setSupportRequests([]);
      setUnreadRequestsCount(0);
    });
}, [isAdmin, supportNotificationEnabled]); // Depend on isAdmin

// Make sure this useEffect is fetching responses correctly for NON-ADMIN users
useEffect(() => {
  if (isAdmin || !supportNotificationEnabled) {
    setSupportResponses([]);
    setUnreadResponsesCount(0);
    return;
  }

  const savedUser = localStorage.getItem("supportUser");
  if (!savedUser) return;

  try {
    const user = JSON.parse(savedUser);
    const userId = user.id || user._id;

    if (!userId) return;

    fetch(
      `${process.env.REACT_APP_API_URL}/api/support/responses/${userId}`
    )
      .then((res) => res.json())
      .then((data) => {
        const responses = Array.isArray(data) ? data : [];
        setSupportResponses(responses);
        setUnreadResponsesCount(responses.length);
      })
      .catch((err) => {
        console.error("Support response notification error:", err);
        setSupportResponses([]);
        setUnreadResponsesCount(0);
      });
  } catch {
    setSupportResponses([]);
    setUnreadResponsesCount(0);
  }
}, [isAdmin, supportNotificationEnabled]); // Re-run when isAdmin changes // Depend on isAdmin


// Add handler for sending response (Admin)
// Add handler for sending response (Admin)
const handleSendResponse = async (requestId) => {
  if (!responseText.trim()) {
    alert(t("Please enter a response message"));
    return;
  }

  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/support/responses`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supportRequestId: requestId,
          response: responseText,
        }),
      }
    );
    const data = await res.json();

    if (res.ok) {
      alert(t("Response sent successfully ✅"));
      setResponseText("");
      setSelectedRequestId(null);
      
      // 🔥 REMOVE the replied request from the list immediately
      setSupportRequests(prev => 
        prev.filter(req => req._id !== requestId)
      );
      
      // 🔥 UPDATE the badge count
      setUnreadRequestsCount(prev => Math.max(0, prev - 1));
      
    } else {
      alert(data.message || t("Failed to send response"));
    }
  } catch (err) {
    console.error("Error:", err);
    alert(t("Error sending response"));
  }
};

// Add handler to mark response as read (User)
// Add handler to mark response as read (User)
const handleMarkResponseRead = async (responseId) => {
  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/support/responses/${responseId}/read`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (res.ok) {
      // 🔥 Remove from list
      setSupportResponses(prev => 
        prev.filter(r => r._id !== responseId)
      );
      
      // 🔥 Decrease the badge count
      setUnreadResponsesCount(prev => Math.max(0, prev - 1));
      
      alert(t("✅ Marked as read"));
    }
  } catch (err) {
    console.error("Error:", err);
  }
};



// Add this useEffect to handle redirect after Google login:

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("supportToken");
  const error = params.get("error");

  if (error) {
    alert(t("Google login failed. Please try again."));
    return;
  }

  if (token) {
    localStorage.setItem("supportToken", token);
    
    // 🔥 Parse token and save supportUser
    const payload = JSON.parse(atob(token.split(".")[1]));
    const supportUserData = {
      id: payload.id,
      email: payload.email,
    };
    
    localStorage.setItem("supportUser", JSON.stringify(supportUserData));
    setSupportUser(supportUserData);

    // Show the support modal to send request
    setShowSupportModal(true);
    
    window.history.replaceState({}, document.title, "/help");
  }
}, []);

const userRole = localStorage.getItem("userRole")?.toLowerCase();

  const currentLeftMargin = isMobile
    ? "0px"
    : isSidebarOpen
    ? "100px"
    : "65px";

  const dynamicContainerStyle = {
    ...styles.container,
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

  const faqs = [
    {
      q: "Why is an overdue amount not showing?",
      a: "The loan has a two-month grace period, so overdue amounts do not appear until it ends.",
    },
    {
      q: "Can increasing my monthly savings help me qualify for a loan?",
      a: "Yes. The system allows a loan up to three times your current savings, so higher savings increase your borrowing limit.",
    },
    {
      q: "What should I do if I forget my password?",
      a: "Contact the system administrator and request a password reset.",
    },
    {
      q: "How can I download a report?",
      a: "Open Reports, select a month and year, then choose Download PDF.",
    },
  ];

  const helpMatches = (...terms) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || terms.some((term) => t(term).toLowerCase().includes(query));
  };
  const showLoanGuide = helpMatches(
    "Loan Usage Guide",
    "Select an employee first to register a loan.",
    "Enter the share percentage correctly.",
    "Loan repayments begin in the third month; the first two months are a grace period.",
    "Late payments incur an automatic 50 ETB monthly penalty."
  );
  const showFaq = helpMatches("FAQ", ...faqs.flatMap((item) => [item.q, item.a]));
  const showSecurity = helpMatches(
    "Security Guide",
    "Always log out when you finish your work.",
    "Never share your password with anyone.",
    "Do not try to change system settings if you encounter a problem."
  );
  const showQuickActions = helpMatches(
    "Quick Actions",
    "Use these links to complete common tasks:",
    "View the main information",
    "Download report PDFs",
    "Adjust penalties"
  );
  const showSupport = helpMatches(
    "Technical Support",
    "Contact Technical Support",
    "System Status: Online"
  );
  const showHours = helpMatches("Support Hours", "Monday - Friday:", "Saturday:", "Sunday:");
  const hasResults = showLoanGuide || showFaq || showSecurity || showQuickActions || showSupport || showHours;
 
  return (
    <div className="help-page-container" style={dynamicContainerStyle}>

           {/* ADMIN SUPPORT REQUESTS PANEL */}
          {isAdmin && (
              <div style={styles.notificationBadge}>
                <button
                  onClick={() => setShowRequestsList(!showRequestsList)}
                  style={styles.supportButton}
                >
                  📧 {t("Support Requests")}
                  {supportRequests.length > 0 && (
                    <span style={styles.badge}>{supportRequests.length}</span>
                  )}
                </button>

          {showRequestsList && (
            <div style={styles.requestsPanel}>
              <h3 style={styles.panelTitle}>{t("Support Requests")}</h3>
              
              {supportRequests.length === 0 ? (
                <p style={styles.emptyMessage}>{t("No pending requests")}</p>
              ) : (
                 supportRequests.map(request => (
                  <div key={request._id} style={styles.requestCard}>
                    <div style={styles.requestHeader}>
                      <strong style={{ color: "#1e40af" }}>
                        {request.supportUserId?.name || request.senderEmail}
                      </strong>
                      <span style={styles.timestamp}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={styles.requestEmail}>
                      <strong>{t("Email:")}</strong> {request.senderEmail}
                    </p>

                    <p style={styles.requestQuestion}>
                      <strong>{t("Question:")}</strong> {request.question}
                    </p>
                     {selectedRequestId === request._id ? (
                      <div style={styles.responseForm}>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder={t("Type your response here...")}
                          style={styles.responseTextarea}
                        />
                        <div style={styles.responseActions}>
                          <button
                            onClick={() => handleSendResponse(request._id)}
                            style={styles.sendBtn}
                          >
                            {t("Send")} ✓
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequestId(null);
                              setResponseText("");
                            }}
                            style={styles.cancelBtn}
                          >
                            {t("Cancel")} ✕
                          </button>
                                  </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedRequestId(request._id)}
                        style={styles.replyBtn}
                      >
                        {t("Reply")} →
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

 {/* USER RESPONSE NOTIFICATIONS PANEL */}
      {!isAdmin && (
        <div style={styles.notificationBadge}>
          <button
            onClick={() => setShowResponsesList(!showResponsesList)}
            style={styles.supportButton}
          >
            💬 {t("Responses")}
            {supportResponses.length > 0 && (
              <span style={styles.badge}>{supportResponses.length}</span>
            )}
          </button>

          {showResponsesList && (
            <div style={styles.responsesPanel}>
              <h3 style={styles.panelTitle}>{t("Your Responses")}</h3>
              
              {supportResponses.length === 0 ? (
                <p style={styles.emptyMessage}>{t("No responses yet")}</p>
              ) : (
                 supportResponses.map(resp => (
                  <div key={resp._id} style={styles.responseCard}>
                    <div style={styles.responseHeader}>
                      <strong style={{ color: "#059669" }}>{t("Response Received")}</strong>
                      <span style={styles.timestamp}>
                        {new Date(resp.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={styles.originalQuestion}>
                      <strong>{t("Your Question:")}</strong> {resp.originalQuestion}
                    </p>

                    <p style={styles.responseMessage}>
                      <strong>{t("Response:")}</strong> {resp.response}
                    </p>

                    <button
                      onClick={() => handleMarkResponseRead(resp._id)}
                      style={styles.markReadBtn}
                    >
                      {t("Mark as Read")} ✓
                    </button>
                  </div>
                      ))
              )}
            </div>
          )}
        </div>
      )}

{unreadRequestsCount > 0 && (
  <span style={styles.badge}>{unreadRequestsCount}</span>
)}

{unreadResponsesCount > 0 && (
  <span style={styles.badge}>{unreadResponsesCount}</span>
)}

      {/* HERO SECTION */}
      <section className="help-hero">
        <div className="hero-shape hero-shape-one" />
        <div className="hero-shape hero-shape-two" />
        <div className="hero-star star-one">✦</div>
        <div className="hero-star star-two">✦</div>

        <div className="hero-content">
          <div className="hero-logo">
            <FaRegSmile />
            <span>{t("Cooperative Help Center")}</span>
          </div>

          <h1>{t("Help Center")}</h1>

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder={t("Search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="help-intro">
        <h2>{t("Need help? We’ve got your back.")}</h2>
        <p>{t("Find answers about loans, savings, reports, passwords, and technical support here.")}</p>
      </section>

      {/* HELP CARDS */}
      <section className="help-cards-section">
        {!hasResults ? (
          <div className="no-results">
            {t("No help topics found for")} “{searchTerm}”.
          </div>
        ) : (
          <div className="help-grid">
            {/* LOAN GUIDE */}
            {showLoanGuide && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaBookOpen />
                </div>

                <h3>{t("Loan Usage Guide")}</h3>

                <ul className="card-list">
                  <li>{t("Select an employee first to register a loan.")}</li>
                  <li>{t("Enter the share percentage correctly.")}</li>
                  <li>{t("Loan repayments begin in the third month; the first two months are a grace period.")}</li>
                  <li>{t("Late payments incur an automatic 50 ETB monthly penalty.")}</li>
                </ul>
              </div>
            )}

            {/* FAQ */}
            {showFaq && (
              <div className="help-card faq-card">
                <div className="help-card-icon">
                  <FaInfoCircle />
                </div>

                <h3>{t("FAQ")}</h3>

                <div className="faq-scroll">
                  {faqs.map((item, index) => (
                    <div className="faq-item" key={index}>
                      <strong>{t("Question:")}</strong> {t(item.q)}
                      <br />
                      <span>
                        <strong>{t("Answer:")}</strong> {t(item.a)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY */}
            {showSecurity && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaShieldAlt />
                </div>

                <h3>{t("Security Guide")}</h3>

                <ul className="card-list">
                  <li>{t("Always log out when you finish your work.")}</li>
                  <li>{t("Never share your password with anyone.")}</li>
                  <li>{t("Do not try to change system settings if you encounter a problem.")}</li>
                </ul>
              </div>
            )}

            {/* QUICK ACTIONS */}
            {showQuickActions && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaKeyboard />
                </div>

                <h3>{t("Quick Actions")}</h3>

                <p className="card-description">
                  {t("Use these links to complete common tasks:")}
                </p>

                <ul className="card-list">
                  <li>
                    <strong>{t("Dashboard")}:</strong> {t("View the main information")}
                  </li>
                  <li>
                    <strong>{t("Reports")}:</strong> {t("Download report PDFs")}
                  </li>
                  <li>
                    <strong>{t("Settings")}:</strong> {t("Adjust penalties")}
                  </li>
                </ul>
              </div>
            )}

            {/* TECHNICAL SUPPORT */}
            {showSupport && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaHeadset />
                </div>

                <h3>{t("Technical Support")}</h3>

                <div className="support-contact">
                  <p>
                    <strong>{t("Admin")}:</strong> Teklu Abebe Temitme
                  </p>

                  <p>
                    <strong>{t("Email:")}</strong>{" "}
                    <button
  type="button"
  className="support-contact-link"
  onClick={() => setShowSupportModal(true)}
>
  {t("Contact Technical Support")}
</button>
                  </p>

                  <p>
                    <strong>{t("Phone") }:</strong>{" "}
                    <a href="tel:+251905698140">+251905698140</a>
                  </p>
                </div>

                <div className="status-badge">{t("System Status: Online")}</div>
              </div>
            )}

            {/* SUPPORT HOURS */}
            {showHours && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaClock />
                </div>

                <h3>{t("Support Hours")}</h3>

                <ul className="card-list">
                  <li>
                    <strong>{t("Monday - Friday:")}</strong> 2:00 - 11:00
                  </li>
                  <li>
                    <strong>{t("Saturday:")}</strong> 2:00 - 6:00
                  </li>
                  <li>
                    <strong>{t("Sunday:")}</strong> {t("Closed")}
                  </li>
                </ul>
              </div>
            )}
            {showSupportModal && (
  <div className="support-modal-overlay">
    <div className="support-modal">
      <button
        className="support-modal-close"
        onClick={() => setShowSupportModal(false)}
      >
        <FaTimes />
      </button>

      {!supportUser ? (
        <>
          <h2>
            {supportMode === "login"
              ? t("Support Login")
                : t("Create Support Account")}
          </h2>

          <p className="support-modal-description">
            {t("Use a support account to contact the technical support team.")}
          </p>

          <form onSubmit={handleSupportAuth}>
            {supportMode === "register" && (
              <input
                name="name"
                placeholder={t("Full name")}
                value={supportForm.name}
                onChange={handleSupportChange}
                required
              />
            )}

            <input
              type="email"
              name="email"
              placeholder={t("Email address")}
              value={supportForm.email}
              onChange={handleSupportChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder={t("Password")}
              value={supportForm.password}
              onChange={handleSupportChange}
              required
            />

            <button type="submit" className="support-primary-btn">
              {supportMode === "login" ? t("Login") : t("Create Account")}
            </button>
          </form>

          <button
            type="button"
            className="google-support-btn"
            onClick={handleGoogleLogin}
          >
            <FaGoogle /> {t("Continue with Google")}
          </button>

          <button
            type="button"
            className="support-switch-btn"
            onClick={() =>
              setSupportMode((mode) =>
                mode === "login" ? "register" : "login"
              )
            }
          >
            {supportMode === "login"
              ? t("Create a support account")
              : t("Already have an account? Login")}
          </button>
        </>
      ) : (
        <>
          <h2>{t("Contact Technical Support")}</h2>

          <form onSubmit={handleSendSupportRequest}>
           <label>{t("Recipient email")}</label>
            <input
              type="email"
              name="recipientEmail"
              placeholder={t("Enter support team email")}
              value={supportForm.recipientEmail}
              onChange={handleSupportChange}
              required
            />

            <label>{t("Your question")}</label>
            <textarea
              name="question"
              placeholder={t("Describe your question or problem...")}
              value={supportForm.question}
              onChange={handleSupportChange}
              rows="6"
              required
            />

            <button
              type="submit"
              className="support-primary-btn"
              disabled={sendingRequest}
            >
              <FaPaperPlane />
              {sendingRequest ? t("Sending...") : t("Send Request")}
            </button>
          </form>
        </>
      )}
    </div>
  </div>
)}
          </div>
        )}
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }
// Add to your styles object in HelpPage.js
        .support-contact-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #5865f2;
  cursor: pointer;
  font-weight: 700;
  text-decoration: underline;
}

.support-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(10, 15, 45, 0.72);
}

.support-modal {
  position: relative;
  width: min(480px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.support-modal h2 {
  margin-top: 0;
  color: #3f4be7;
}

.support-modal form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.support-modal input,
.support-modal textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9ddec;
  border-radius: 8px;
  outline: none;
  font: inherit;
  box-sizing: border-box;
}

.support-modal input:focus,
.support-modal textarea:focus {
  border-color: #5865f2;
}

.support-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  border: 0;
  background: transparent;
  color: #657089;
  cursor: pointer;
  font-size: 20px;
}

.support-primary-btn,
.google-support-btn,
.support-switch-btn {
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.support-primary-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: #5865f2;
  color: #ffffff;
}

.google-support-btn {
  margin-top: 12px;
  background: #ffffff;
  color: #333333;
  border: 1px solid #d9ddec;
}

.support-switch-btn {
  margin-top: 10px;
  background: transparent;
  color: #5865f2;
}

@media (max-width: 520px) {
  .support-modal {
    padding: 22px;
  }
}

        .help-page-container {
          font-family: Arial, sans-serif;
          background: #ffffff;
          min-height: 100vh;
          overflow-x: hidden;
          transition: margin-left 0.3s ease, width 0.3s ease;
        }

        .help-hero {
          position: relative;
          min-height: 320px;
          overflow: hidden;
          background: linear-gradient(135deg, #5865f2 0%, #3f4be7 55%, #2f39c9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 35px 20px;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          width: min(700px, 100%);
          text-align: center;
        }

        .hero-logo {
          position: absolute;
          top: -10px;
          left: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
        }

        .hero-logo svg {
          font-size: 22px;
        }

        .help-hero h1 {
          color: #ffffff;
          font-size: clamp(34px, 5vw, 54px);
          margin: 35px 0 28px;
          font-weight: 800;
        }

        .search-box {
          background: #ffffff;
          height: 58px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 20px;
          box-shadow: 0 10px 24px rgba(20, 30, 120, 0.22);
        }

        .search-box svg {
          color: #8d96aa;
          font-size: 19px;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 16px;
          color: #202225;
          background: transparent;
        }

        .hero-shape {
          position: absolute;
          opacity: 0.16;
          border-radius: 50%;
          background: #d9ddff;
        }

        .hero-shape-one {
          width: 420px;
          height: 420px;
          left: -120px;
          bottom: -290px;
        }

        .hero-shape-two {
          width: 500px;
          height: 500px;
          right: -170px;
          bottom: -350px;
        }

        .hero-star {
          position: absolute;
          color: #a8e6ff;
          font-size: 34px;
        }

        .star-one {
          top: 55px;
          left: 20%;
        }

        .star-two {
          top: 70px;
          right: 20%;
        }

        .help-intro {
          text-align: center;
          max-width: 780px;
          margin: 0 auto;
          padding: 48px 20px 34px;
        }

        .help-intro h2 {
          margin: 0 0 14px;
          color: #2f3545;
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 800;
        }

        .help-intro p {
          margin: 0;
          color: #5c6478;
          line-height: 1.8;
          font-size: 15px;
        }

        .help-cards-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 30px 55px;
        }

        .help-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .help-card {
          min-height: 285px;
          background: #ffffff;
          border: 1px solid #edf0f7;
          border-radius: 12px;
          padding: 26px 22px;
          box-shadow: 0 5px 16px rgba(30, 40, 90, 0.08);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .help-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 14px 28px rgba(63, 75, 231, 0.18);
        }

        .help-card-icon {
          width: 54px;
          height: 54px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #eef0ff;
          color: #5865f2;
          font-size: 26px;
        }

        .help-card h3 {
          margin: 0 0 15px;
          color: #4a56e8;
          font-size: 18px;
          font-weight: 800;
        }

        .card-description {
          margin: 0 0 12px;
          color: #5d6577;
          font-size: 14px;
        }

        .card-list {
          margin: 0;
          padding-left: 20px;
          color: #4f5668;
          font-size: 14px;
          line-height: 1.9;
        }

        .faq-card {
          min-height: 285px;
        }

        .faq-scroll {
          overflow-y: auto;
          max-height: 195px;
          padding-right: 5px;
        }

        .faq-item {
          background: #f3f4ff;
          border-left: 4px solid #5865f2;
          border-radius: 10px;
          padding: 11px 12px;
          margin-bottom: 10px;
          color: #4f5668;
          font-size: 13px;
          line-height: 1.65;
        }

        .faq-item span {
          color: #5d6577;
        }

        .faq-item strong {
          color: #3f4be7;
        }

        .support-contact {
          color: #4f5668;
          font-size: 14px;
          line-height: 1.7;
        }

        .support-contact p {
          margin: 4px 0;
        }

        .support-contact a {
          color: #5865f2;
          font-weight: 700;
          text-decoration: underline;
          word-break: break-word;
        }

        .status-badge {
          margin-top: auto;
          align-self: flex-start;
          padding: 7px 14px;
          border-radius: 20px;
          background: #e7f6e9;
          color: #2e7d32;
          font-size: 12px;
          font-weight: 800;
        }

        .no-results {
          text-align: center;
          padding: 45px 20px;
          color: #687087;
          font-size: 16px;
          background: #f7f8ff;
          border-radius: 10px;
        }

        @media (max-width: 1024px) {
          .help-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .help-page-container {
            margin-left: 0 !important;
            width: 100% !important;
          }

          .help-hero {
            min-height: 290px;
            padding: 25px 18px;
          }

          .hero-logo {
            position: static;
            justify-content: center;
            margin-bottom: 20px;
          }

          .help-hero h1 {
            margin: 0 0 24px;
          }

          .help-cards-section {
            padding: 0 16px 40px;
          }

          .help-intro {
            padding: 35px 18px 28px;
          }
        }

        @media (max-width: 520px) {
          .help-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .help-card {
            min-height: auto;
          }

          .search-box {
            height: 52px;
            padding: 0 15px;
          }

          .search-box input {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    padding: 0,
    boxSizing: "border-box",
  },
  notificationBadge: {
    position: "fixed",
    top: "80px",
    right: "20px",
    zIndex: 999,
  },
  supportButton: {
    padding: "10px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    position: "relative",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
  },

  badge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
  },
   requestsPanel: {
    position: "absolute",
    top: "45px",
    right: "0",
    width: "450px",
    maxWidth: "90vw",
    maxHeight: "600px",
    overflowY: "auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    padding: "16px",
  },
  responsesPanel: {
    position: "absolute",
    top: "45px",
    right: "0",
    width: "450px",
    maxWidth: "90vw",
    maxHeight: "600px",
    overflowY: "auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    padding: "16px",
  },
   panelTitle: {
    margin: "0 0 16px 0",
    color: "#1f2937",
    fontSize: "16px",
    fontWeight: "700",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#9ca3af",
    padding: "20px",
  },
  requestCard: {
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "12px",
    background: "#f9fafb",
  },
  requestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  timestamp: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  requestEmail: {
    margin: "6px 0",
    fontSize: "13px",
    color: "#374151",
  },
   requestQuestion: {
    margin: "8px 0",
    fontSize: "13px",
    color: "#1f2937",
    fontStyle: "italic",
    padding: "8px",
    background: "#fff",
    borderRadius: "4px",
    borderLeft: "3px solid #4f46e5",
  },
  responseForm: {
    marginTop: "12px",
  },
   responseTextarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontFamily: "inherit",
    fontSize: "13px",
    minHeight: "80px",
    resize: "vertical",
  },
   responseActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  sendBtn: {
    flex: 1,
    padding: "6px 12px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
   cancelBtn: {
    flex: 1,
    padding: "6px 12px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  replyBtn: {
    width: "100%",
    padding: "8px 12px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    marginTop: "8px",
  },
  responseCard: {
    padding: "12px",
    border: "1px solid #d1fae5",
    borderRadius: "8px",
    marginBottom: "12px",
    background: "#f0fdf4",
  },
  responseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  originalQuestion: {
    margin: "8px 0",
    fontSize: "13px",
    color: "#374151",
    padding: "6px",
    background: "#fff",
    borderRadius: "4px",
  },
  responseMessage: {
    margin: "8px 0",
    fontSize: "13px",
    color: "#1f2937",
    padding: "8px",
    background: "#fff",
    borderRadius: "4px",
    borderLeft: "3px solid #10b981",
  },
  markReadBtn: {
    width: "100%",
    padding: "6px 12px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    marginTop: "8px",
  },
};