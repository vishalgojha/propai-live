/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIUsageMonitor from './pages/AIUsageMonitor';
import APIKeyManager from './pages/APIKeyManager';
import AboutUs from './pages/AboutUs';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import BlogPost from './pages/BlogPost';
import Blogs from './pages/Blogs';
import BuildingBlog from './pages/BuildingBlog';
import BuildingProfile from './pages/BuildingProfile';
import CronScheduler from './pages/CronScheduler';
import DeveloperDirectory from './pages/DeveloperDirectory';
import DeveloperProfile from './pages/DeveloperProfile';
import Disclaimer from './pages/Disclaimer';
import Docs from './pages/Docs';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import LiveDashboard from './pages/LiveDashboard';
import LocationProperties from './pages/LocationProperties';
import MapSearch from './pages/MapSearch';
import MarketInsights from './pages/MarketInsights';
import ParityReport from './pages/ParityReport';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PropertyDetails from './pages/PropertyDetails';
import QRGenerator from './pages/QRGenerator';
import RequirementDetails from './pages/RequirementDetails';
import Sitemap from './pages/Sitemap';
import SmartFeed from './pages/SmartFeed';
import SmartFeedAnalytics from './pages/SmartFeedAnalytics';
import SocialListing from './pages/SocialListing';
import TermsOfService from './pages/TermsOfService';
import Transactions from './pages/Transactions';
import LicenseActivation from './pages/LicenseActivation';
import LicenseAdmin from './pages/LicenseAdmin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIUsageMonitor": AIUsageMonitor,
    "APIKeyManager": APIKeyManager,
    "AboutUs": AboutUs,
    "Admin": Admin,
    "AdminDashboard": AdminDashboard,
    "AdminLogin": AdminLogin,
    "BlogPost": BlogPost,
    "Blogs": Blogs,
    "BuildingBlog": BuildingBlog,
    "BuildingProfile": BuildingProfile,
    "CronScheduler": CronScheduler,
    "DeveloperDirectory": DeveloperDirectory,
    "DeveloperProfile": DeveloperProfile,
    "Disclaimer": Disclaimer,
    "Docs": Docs,
    "FAQ": FAQ,
    "Home": Home,
    "LiveDashboard": LiveDashboard,
    "LocationProperties": LocationProperties,
    "MapSearch": MapSearch,
    "MarketInsights": MarketInsights,
    "ParityReport": ParityReport,
    "PrivacyPolicy": PrivacyPolicy,
    "PropertyDetails": PropertyDetails,
    "QRGenerator": QRGenerator,
    "RequirementDetails": RequirementDetails,
    "Sitemap": Sitemap,
    "SmartFeed": SmartFeed,
    "SmartFeedAnalytics": SmartFeedAnalytics,
    "SocialListing": SocialListing,
    "TermsOfService": TermsOfService,
    "Transactions": Transactions,
    "LicenseActivation": LicenseActivation,
    "LicenseAdmin": LicenseAdmin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};