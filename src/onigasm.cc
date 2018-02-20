/*
 * simple.c
 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "oniguruma.h"
#include <emscripten/emscripten.h>
#include "onigstring.h"

extern "C" {
// int main()
// {
//   OnigEncoding use_endfcs[] df=ddf {ONIG_ENCODING_UTF8};
//   onig_initializbfe(use_encs,dfd sizeof(useg_encs) / sizeof(use_encs[0]));
//   return 0;
// }

int lastErrCode = 0;

EMSCRIPTEN_KEEPALIVE
char *getLastError()
{
  static char s[ONIG_MAX_ERROR_MESSAGE_LEN];
  onig_error_code_to_str((UChar *)s, lastErrCode);
  return s;
}

EMSCRIPTEN_KEEPALIVE
int compilePattern(UChar *pattern, int *regexTPtr)
{
  int r;
  regex_t *reg;
  OnigErrorInfo einfo;
  r = onig_new(&reg, pattern, pattern + strlen((char *)pattern),
               ONIG_OPTION_CAPTURE_GROUP, ONIG_ENCODING_UTF8,
               ONIG_SYNTAX_DEFAULT, &einfo);
  if (r != ONIG_NORMAL)
  {
    lastErrCode = r;
    return -1;
  }
  *regexTPtr = (int)reg;
  return 0;
}

EMSCRIPTEN_KEEPALIVE
int disposeCompiledPatterns(regex_t **patterns, int patternCount)
{
  for (int i = 0; i < patternCount; i++)
  {
    onig_free(patterns[i]);
  }
  return 0;
}

EMSCRIPTEN_KEEPALIVE
int findBestMatch(regex_t **patterns, int patternCount, UChar *utf8String, int strLenAsUtf16, int startOffset, int *resultInfo)
{
  int r;
  unsigned char *start, *range, *end;
  OnigErrorInfo einfo;
  OnigRegion *bestRegion = NULL;
  OnigString *oStr = NULL;
  int bestRegionIdx = 0;
  bool hasMultibyteCharacters = false;
   for (int i = 0; i < patternCount; i++)
  {
    OnigRegion *region;
    region = onig_region_new();
    int strLen = strlen((char *)utf8String);
    hasMultibyteCharacters = strLen > strLenAsUtf16;
    if (hasMultibyteCharacters)
    {
      oStr = new OnigString((char *)utf8String, strLenAsUtf16);
    }
    end = utf8String + strLen;

    start = utf8String + (unsigned char)(hasMultibyteCharacters ? oStr->ConvertUtf16OffsetToUtf8(startOffset) : startOffset);
    range = end;
    r = onig_search(patterns[i], utf8String, end, start, range, region, ONIG_OPTION_NONE);
    if (r >= 0)
    {
      if (region->num_regs > 0 && (bestRegion == NULL || region->beg[0] < bestRegion->beg[0]))
      {
        bestRegion = region;
        bestRegionIdx = i;
        continue;
      }
    }
    else if (r == ONIG_MISMATCH)
    {
      // TODO
    }
    else
    { /* error */
      onig_region_free(region, 1);
      lastErrCode = r;
      return -1;
    }
    onig_region_free(region, 1);
  }

  if (bestRegion != NULL)
  {
    int resultLen = (bestRegion->num_regs) * 2;
    int *res = (int *)malloc(resultLen * sizeof(int));
    int i = 0;
    int j = 0;

    if (hasMultibyteCharacters)
    {
      while (i < bestRegion->num_regs)
      {
        res[j++] = oStr->ConvertUtf8OffsetToUtf16(bestRegion->beg[i]);
        res[j++] = oStr->ConvertUtf8OffsetToUtf16(bestRegion->end[i]);
        i++;
      }
    }
    else
    {
      while (i < bestRegion->num_regs)
      {
        res[j++] = bestRegion->beg[i];
        res[j++] = bestRegion->end[i];
        i++;
      }
    }
    resultInfo[0] = bestRegionIdx;
    resultInfo[1] = (int)res;
    resultInfo[2] = resultLen;
    onig_region_free(bestRegion, 1);
  }
  else
  {
    resultInfo[0] = 0;
    resultInfo[1] = 0;
    resultInfo[2] = 0;
  }
  delete oStr;
  return 0;
}
}