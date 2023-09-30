const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const _ = require('lodash');

const app = express();
app.use(express.json());

const port = 3000; // Set your desired port
let blogData;
// Middleware to retrieve and analyze blog data
app.get('/api/blog-stats', async (req, res) => {
  try {
    if (!blogData) {
    const response = await fetch('https://intent-kit-16.hasura.app/api/rest/blogs', {
      method: 'GET',
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch data from the third-party API');
    }
    blogData = await response.json(); // Assign the fetched data to the blogData variable
  }
     
        // Calculate analytics using Lodash
        const totalBlogs = blogData.blogs.length;
        console.log(totalBlogs)
        const longestBlog = _.maxBy(blogData.blogs, 'title.length');
        console.log(longestBlog)
        const blogsWithPrivacy = blogData.blogs.filter(blog => blog.title.toLowerCase().includes('privacy'));
        console.log(blogsWithPrivacy)
        const uniqueBlogTitles = _.uniqBy(blogData.blogs, 'title');
        console.log(uniqueBlogTitles)

        // Prepare the response JSON
        const blogStats = {
          totalBlogs,
          longestBlog: longestBlog ? longestBlog.title : null,
          blogsWithPrivacy: blogsWithPrivacy.length,
          uniqueBlogTitles: uniqueBlogTitles.map(blog => blog.title),
        };

        res.json(blogStats);
      
     
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});


// Middleware for blog search
app.get('/api/blog-search', (req, res) => {
  try {
    const query = req.query.query; // Get the query parameter from the request

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameter' });
    }

    if (!blogData || !blogData.blogs) {
      return res.status(500).json({ error: 'Blog data is not available' });
    }

    // Search blogs based on the query (case-insensitive)
    const matchingBlogs = blogData.blogs.filter(blog =>
      blog.title.toLowerCase().includes(query.toLowerCase())
    );

    // Prepare the response JSON
    const searchResults = {
      query,
      matchingBlogs,
    };

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
