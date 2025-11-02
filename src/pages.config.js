import SmartFeed from './pages/SmartFeed';
import Home from './pages/Home';
import Blogs from './pages/Blogs';
import BlogPost from './pages/BlogPost';
import Admin from './pages/Admin';
import Layout from './Layout.jsx';


export const PAGES = {
    "SmartFeed": SmartFeed,
    "Home": Home,
    "Blogs": Blogs,
    "BlogPost": BlogPost,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "SmartFeed",
    Pages: PAGES,
    Layout: Layout,
};