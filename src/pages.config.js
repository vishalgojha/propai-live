import SmartFeed from './pages/SmartFeed';
import Home from './pages/Home';
import Blogs from './pages/Blogs';
import BlogPost from './pages/BlogPost';
import Admin from './pages/Admin';
import Buildings from './pages/Buildings';
import BuildingProfile from './pages/BuildingProfile';
import AdminBrokers from './pages/AdminBrokers';
import AdminRequirements from './pages/AdminRequirements';
import Layout from './Layout.jsx';


export const PAGES = {
    "SmartFeed": SmartFeed,
    "Home": Home,
    "Blogs": Blogs,
    "BlogPost": BlogPost,
    "Admin": Admin,
    "Buildings": Buildings,
    "BuildingProfile": BuildingProfile,
    "AdminBrokers": AdminBrokers,
    "AdminRequirements": AdminRequirements,
}

export const pagesConfig = {
    mainPage: "SmartFeed",
    Pages: PAGES,
    Layout: Layout,
};