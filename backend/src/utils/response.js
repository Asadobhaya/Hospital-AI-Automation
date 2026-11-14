// src/utils/response.js — Consistent API response helpers
'use strict';

/**
 * Send a success response
 */
function success(res, data = null, statusCode = 200, pagination = null) {
  const body = {
    success: true,
    data,
    error: null,
  };
  if (pagination) {
    body.pagination = pagination;
  }
  return res.status(statusCode).json(body);
}

/**
 * Send an error response
 */
function error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
  const body = {
    success: false,
    data: null,
    error: {
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(body);
}

/**
 * Build pagination metadata
 */
function buildPagination(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse pagination query params with defaults
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Parse sort query params
 */
function parseSort(query, allowedFields, defaultField = 'created_at', defaultOrder = 'desc') {
  const sortBy = allowedFields.includes(query.sort_by) ? query.sort_by : defaultField;
  const sortOrder = ['asc', 'desc'].includes(query.sort_order) ? query.sort_order : defaultOrder;
  return { sortBy, sortOrder: sortOrder === 'asc' };
}

module.exports = {
  success,
  error,
  successResponse: success,
  errorResponse: error,
  buildPagination,
  parsePagination,
  parseSort,
};
