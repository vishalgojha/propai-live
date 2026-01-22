import AIHub from './pages/AIHub';
import AIUsageMonitor from './pages/AIUsageMonitor';
import Admin from './pages/Admin';
import AdminBrokers from './pages/AdminBrokers';
import AdminLogin from './pages/AdminLogin';
import AdminRequirements from './pages/AdminRequirements';
import AgentHub from './pages/AgentHub';
import AutomationHub from './pages/AutomationHub';
import BrokerAnalytics from './pages/BrokerAnalytics';
import BrokerAssistant from './pages/BrokerAssistant';
import BrokerInbox from './pages/BrokerInbox';
import BrokerPerformance from './pages/BrokerPerformance';
import BrokerProfile from './pages/BrokerProfile';
import BuildingBlog from './pages/BuildingBlog';
import BuildingProfile from './pages/BuildingProfile';
import CronScheduler from './pages/CronScheduler';
import DeveloperProfile from './pages/DeveloperProfile';
import Disclaimer from './pages/Disclaimer';
import Home from './pages/Home';
import InteractionLogs from './pages/InteractionLogs';
import LocationProperties from './pages/LocationProperties';
import MyProfile from './pages/MyProfile';
import ParityReport from './pages/ParityReport';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PropertyDetails from './pages/PropertyDetails';
import QRGenerator from './pages/QRGenerator';
import RealtorPage from './pages/RealtorPage';
import RequirementDetails from './pages/RequirementDetails';
import SmartFeed from './pages/SmartFeed';
import SmartFeedAnalytics from './pages/SmartFeedAnalytics';
import SocialListing from './pages/SocialListing';
import TermsOfService from './pages/TermsOfService';
import MapSearch from './pages/MapSearch';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIHub": AIHub,
    "AIUsageMonitor": AIUsageMonitor,
    "Admin": Admin,
    "AdminBrokers": AdminBrokers,
    "AdminLogin": AdminLogin,
    "AdminRequirements": AdminRequirements,
    "AgentHub": AgentHub,
    "AutomationHub": AutomationHub,
    "BrokerAnalytics": BrokerAnalytics,
    "BrokerAssistant": BrokerAssistant,
    "BrokerInbox": BrokerInbox,
    "BrokerPerformance": BrokerPerformance,
    "BrokerProfile": BrokerProfile,
    "BuildingBlog": BuildingBlog,
    "BuildingProfile": BuildingProfile,
    "CronScheduler": CronScheduler,
    "DeveloperProfile": DeveloperProfile,
    "Disclaimer": Disclaimer,
    "Home": Home,
    "InteractionLogs": InteractionLogs,
    "LocationProperties": LocationProperties,
    "MyProfile": MyProfile,
    "ParityReport": ParityReport,
    "PrivacyPolicy": PrivacyPolicy,
    "PropertyDetails": PropertyDetails,
    "QRGenerator": QRGenerator,
    "RealtorPage": RealtorPage,
    "RequirementDetails": RequirementDetails,
    "SmartFeed": SmartFeed,
    "SmartFeedAnalytics": SmartFeedAnalytics,
    "SocialListing": SocialListing,
    "TermsOfService": TermsOfService,
    "MapSearch": MapSearch,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};