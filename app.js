const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const _ = require('lodash');

const app = express();
app.use(express.json());

const port = 3000;
let blogDataPromise;

const fetchBlogData = async () => {
  const response = await fetch('https://intent-kit-16.hasura.app/api/rest/blogs', {
    method: 'GET',
    headers: {
      'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data from the third-party API');
  }

  return response.json();
};

// Middleware to retrieve and cache blog data
const getBlogData = async () => {
  if (!blogDataPromise) {
    blogDataPromise = fetchBlogData();
  }

  return blogDataPromise;
};

// Custom memoization function to cache analytics results
const memoizedAnalytics = _.memoize(async () => {
  const blogData = await getBlogData();

  // Calculate analytics using Lodash
  const totalBlogs = blogData.blogs.length;
  console.log(totalBlogs);
  const longestBlog = _.maxBy(blogData.blogs, 'title.length');
  console.log(longestBlog);
  const blogsWithPrivacy = blogData.blogs.filter(blog => blog.title.toLowerCase().includes('privacy'));
  console.log(blogsWithPrivacy);
  const uniqueBlogTitles = _.uniqBy(blogData.blogs, 'title');
  console.log(uniqueBlogTitles);

  // Prepare and return the response JSON
  return {
    totalBlogs,
    longestBlog: longestBlog ? longestBlog.title : null,
    blogsWithPrivacy: blogsWithPrivacy.length,
    uniqueBlogTitles: uniqueBlogTitles.map(blog => blog.title),
  };
}, () => 'cacheKey'); // Using a constant cache key

// Middleware to retrieve and analyze blog data
app.get('/api/blog-stats', async (req, res) => {
  try {
    const analyticsResult = await memoizedAnalytics();
    res.json(analyticsResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// Custom memoization function to cache search results
const memoizedSearch = _.memoize(async (query) => {
  const blogData = await getBlogData();

const matchingBlogs = blogData.blogs.filter(blog =>
  blog.title.toLowerCase().includes(query.toLowerCase())
);

// Prepare and return the response JSON
return {
  query,
  matchingBlogs,
};
}, (query) => query); // Using the query as the cache key

// Middleware for blog search
app.get('/api/blog-search', async (req, res) => {
  try {
    const query = req.query.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameter' });
    }

    const searchResult = await memoizedSearch(query);
    res.json(searchResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
