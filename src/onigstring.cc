#include "onigstring.h"
#include <string>
#include <codecvt>

std::wstring UTF8_to_wchar(const char *in)
{
    std::wstring out;
    unsigned int codepoint;
    while (*in != 0)
    {
        unsigned char ch = static_cast<unsigned char>(*in);
        if (ch <= 0x7f)
            codepoint = ch;
        else if (ch <= 0xbf)
            codepoint = (codepoint << 6) | (ch & 0x3f);
        else if (ch <= 0xdf)
            codepoint = ch & 0x1f;
        else if (ch <= 0xef)
            codepoint = ch & 0x0f;
        else
            codepoint = ch & 0x07;
        ++in;
        if (((*in & 0xc0) != 0x80) && (codepoint <= 0x10ffff))
        {
            if (sizeof(wchar_t) > 2)
                out.append(1, static_cast<wchar_t>(codepoint));
            else if (codepoint > 0xffff)
            {
                out.append(1, static_cast<wchar_t>(0xd800 + (codepoint >> 10)));
                out.append(1, static_cast<wchar_t>(0xdc00 + (codepoint & 0x03ff)));
            }
            else if (codepoint < 0xd800 || codepoint >= 0xe000)
                out.append(1, static_cast<wchar_t>(codepoint));
        }
    }
    return out;
}

extern "C" {
OnigString::OnigString(char *value, int lenAsUtf16)
    : utf8Value(value), utf8_length_(strlen(value))
{
    hasMultiByteChars = lenAsUtf16 != utf8_length_;

    if (hasMultiByteChars)
    {
        // std::wstring_convert<std::codecvt_utf8<wchar_t>> utf8_conv;
        std::string str(value);
        std::wstring utf16Value = UTF8_to_wchar(value);
        // std::wstring utf16Value = utf8_conv.from_bytes(str);
        // std::wstring utf16Value(&str[0], &str[lenAsUtf16]);
        utf16_length_ = lenAsUtf16;

        utf16OffsetToUtf8 = new int[utf16_length_ + 1];
        utf16OffsetToUtf8[utf16_length_] = utf8_length_;

        utf8OffsetToUtf16 = new int[utf8_length_ + 1];
        utf8OffsetToUtf16[utf8_length_] = utf16_length_;

        // http://stackoverflow.com/a/148766
        int i8 = 0;
        for (int i16 = 0, len = utf16_length_; i16 < len; i16++)
        {
            uint16_t in = (utf16Value)[i16];

            unsigned int codepoint = in;
            bool wasSurrogatePair = false;

            if (in >= 0xd800 && in <= 0xdbff)
            {
                // Hit a high surrogate, try to look for a matching low surrogate
                if (i16 + 1 < len)
                {
                    uint16_t next = (utf16Value)[i16 + 1];
                    if (next >= 0xdc00 && next <= 0xdfff)
                    {
                        // Found the matching low surrogate
                        codepoint = (((in - 0xd800) << 10) + 0x10000) | (next - 0xdc00);
                        wasSurrogatePair = true;
                    }
                }
            }

            utf16OffsetToUtf8[i16] = i8;

            if (codepoint <= 0x7f)
            {
                utf8OffsetToUtf16[i8++] = i16;
            }
            else if (codepoint <= 0x7ff)
            {
                utf8OffsetToUtf16[i8++] = i16;
                utf8OffsetToUtf16[i8++] = i16;
            }
            else if (codepoint <= 0xffff)
            {
                utf8OffsetToUtf16[i8++] = i16;
                utf8OffsetToUtf16[i8++] = i16;
                utf8OffsetToUtf16[i8++] = i16;
            }
            else
            {
                utf8OffsetToUtf16[i8++] = i16;
                utf8OffsetToUtf16[i8++] = i16;
                utf8OffsetToUtf16[i8++] = i16;
                utf8OffsetToUtf16[i8++] = i16;
            }

            if (wasSurrogatePair)
            {
                utf16OffsetToUtf8[i16 + 1] = utf16OffsetToUtf8[i16];
                i16++;
            }
        }
    }
}

OnigString::~OnigString()
{
    if (hasMultiByteChars)
    {
        delete[] utf16OffsetToUtf8;
        delete[] utf8OffsetToUtf16;
    }
}

int OnigString::ConvertUtf8OffsetToUtf16(int utf8Offset)
{
    if (hasMultiByteChars)
    {
        if (utf8Offset < 0)
        {
            return 0;
        }
        if ((size_t)utf8Offset > utf8_length_)
        {
            return utf16_length_;
        }
        return utf8OffsetToUtf16[utf8Offset];
    }
    return utf8Offset;
}

int OnigString::ConvertUtf16OffsetToUtf8(int utf16Offset)
{
    if (hasMultiByteChars)
    {
        if (utf16Offset < 0)
        {
            return 0;
        }
        if ((size_t)utf16Offset > utf16_length_)
        {
            return utf8_length_;
        }
        return utf16OffsetToUtf8[utf16Offset];
    }
    return utf16Offset;
}
}