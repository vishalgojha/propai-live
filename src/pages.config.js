import SmartFeed from './pages/SmartFeed';
import Home from './pages/Home';
import Blogs from './pages/Blogs';
import BlogPost from './pages/BlogPost';
import Layout from './Layout.jsx';


export const PAGES = {
    "SmartFeed": SmartFeed,
    "Home": Home,
    "Blogs": Blogs,
    "BlogPost": BlogPost,
}

export const pagesConfig = {
    mainPage: "SmartFeed",
    Pages: PAGES,
    Layout: Layout,
};