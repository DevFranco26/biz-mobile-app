// src/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Internal Server Error',
    });
  };
  
  export default errorHandler;
  