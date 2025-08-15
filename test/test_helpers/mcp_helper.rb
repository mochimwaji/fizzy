module McpHelper
  def parse_paginated_response(response)
    records_match = response.match(/Records:\n```\n(\[.*\])\n```/m)
    assert records_match, "Could not find any records in the paginated response"
    records = JSON.parse(records_match[1])

    next_param_match = response.match(/next page:\n```\n(\[.*\])\n```/m)
    next_param = next_param_match[1] if next_param_match

    { records: records, next_param: next_param }
  end
end
