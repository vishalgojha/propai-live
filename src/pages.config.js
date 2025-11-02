import SmartFeed from './pages/SmartFeed';
import Home from './pages/Home';
import Layout from './Layout.jsx';


export const PAGES = {
    "SmartFeed": SmartFeed,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "SmartFeed",
    Pages: PAGES,
    Layout: Layout,
};