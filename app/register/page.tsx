'use client';

import { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import PublicStudentForm from '../components/PublicStudentForm';
import { StudentFormData } from '../types/student';

export default function Register() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (formData: StudentFormData) => {
    try {
      // Add isPublicSubmission flag to identify submissions from public form
      await addDoc(collection(db, 'students'), {
        ...formData,
        isPublicSubmission: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Gửi email thông báo cho admin thông qua API route
      try {
        const response = await fetch('/api/registration-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            dob: formData.dob,
            province: formData.province,
            targetScore: formData.targetScore,
            tuitionFee: formData.tuitionFee
          }),
        });
        
        if (response.ok) {
          console.log('Đã gửi email thông báo đăng ký thành công');
        } else {
          console.error('Lỗi khi gửi email thông báo:', await response.text());
        }
      } catch (emailError) {
        // Ghi log lỗi nhưng không ảnh hưởng đến trải nghiệm người dùng
        console.error('Lỗi khi gửi email thông báo:', emailError);
      }
      
      setSubmitted(true);
      setError(null);
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Đăng ký không thành công. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#fc5d01] mb-2">PTE Intensive</h1>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Đăng Ký Học Viên</h2>
          <p className="text-gray-600 mb-8">Vui lòng đọc quy định đào tạo và cam kết đầu ra trước khi đăng ký</p>
        </div>
        
        {submitted ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-4 text-[#fc5d01]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#fc5d01] mb-2">Đăng Ký Thành Công!</h2>
            <p className="text-gray-600 mb-6">Cảm ơn bạn đã đăng ký. Thông tin của bạn đã được gửi thành công.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}
            
            {!termsAccepted ? (
              <div className="space-y-6">
                <div className="border border-[#fdbc94] rounded-lg p-6 bg-[#fedac2] bg-opacity-30">
                  <h3 className="text-xl font-bold text-[#fc5d01] mb-4 text-center">QUY ĐỊNH ĐÀO TẠO VÀ CAM KẾT ĐẦU RA CỦA PTE INTENSIVE</h3>
                  
                  <div className="prose max-w-none text-gray-700 overflow-y-auto max-h-[400px] pr-2">
                    <h4 className="font-bold text-[#fc5d01] mt-4">A. QUY ĐỊNH ĐÀO TẠO</h4>
                    
                    <h5 className="font-semibold mt-3">1.1. Quy định về kết quả đầu vào đối với học viên</h5>
                    <p>- Học viên phải thực hiện và đạt kết quả bài kiểm tra đầu vào tương ứng với mỗi thang điểm số PTE mục tiêu.</p>
                    
                    <h5 className="font-semibold mt-3">1.2. Quy định về mức độ cam kết trong quá trình học tập của học viên</h5>
                    <p>- Học viên không được phép nghỉ quá 02 buổi học, không tham gia lớp học muộn tổng thời gian quá 1 tiếng/buổi.</p>
                    <p>- Trong suốt khóa học, học viên được yêu cầu học tập nghiêm túc, tập trung theo hướng dẫn lộ trình của PTE Intensive đã thiết kế. Ngoài ra, học viên cần tương tác và tham gia đầy đủ các buổi học chính của Giảng viên phụ trách lớp. PTE Intensive được quyền đơn phương chấm dứt đào tạo đối với học viên đó và không chịu trách nhiệm cam kết đầu ra nào nếu học viên không thực hiện đúng cam kết tại Mục 1.2 này.</p>
                    
                    <h5 className="font-semibold mt-3">1.3. Quy định về bài tập về nhà và bài Mock Test (thi thử) của học viên</h5>
                    <h6 className="font-medium mt-2">1.3.1. Đối với bài tập về nhà</h6>
                    <p>- Học sinh bắt buộc hoàn thành 100% bài tập về nhà và đúng hạn theo yêu cầu của Giảng viên phụ trách khóa học. Trường hợp học viên nghỉ học trong số buổi được phép (tối đa 2 buổi/khóa), học viên vẫn được khuyến nghị sẽ xem lại bài giảng bằng video ghi âm và hoàn thành bài tập được giao (mỗi ngày) trên platform thực hành của PTE Intensive.</p>
                    <p>- Trong trường hợp chưa hoàn thành bài tập về nhà, học viên phải cam kết hoàn thành nộp bài tập đầy đủ trước buổi học kế tiếp bắt đầu. Mỗi học viên chỉ được phép chưa hoàn thành bài tập tối đa 2 buổi/khóa học.</p>
                    
                    <h6 className="font-medium mt-2">1.3.2. Đối với bài Kiểm tra định kỳ và bài Mock Test (thi thử)</h6>
                    <p>- Học viên phải hoàn thành đầy đủ số lượng bài kiểm giá đánh giá định kỳ và bài Mock Test (thi thử) và đúng hạn theo đề nghị của của Giảng viên phụ trách khóa học.</p>
                    <p>- Kết quả của mỗi bài Mock Test (thi thử), học viên đều đạt điểm số tối thiểu 80% điểm Target.</p>
                    <p>- Trong trường hợp đặc biệt và bất khả kháng, học viên sẽ sắp xếp thời gian để tham gia làm bài dự phòng tại buổi khác (liên lạc trực tiếp với Giảng viên phụ trách lớp để thống nhất thời gian)</p>
                    
                    <h5 className="font-semibold mt-3">1.4. Quy định bảo lưu khóa học</h5>
                    <p>- Học viên chỉ được quyền bảo lưu 01 lần duy nhất đối với mỗi khóa học đã đăng ký tại PTE Intensive.</p>
                    <p>- Học viên đã bảo lưu sang khóa học sau (được sự xác nhận của PTE Intensive quản lý) sẽ tham gia học lại theo sự bố trí sắp xếp của Trung Tâm. Mọi trường hợp bảo lưu không có xác nhận từ PTE Intensive sẽ không được giải quyết, nếu học viên muốn trở lại tham gia khóa học, học viên phải đóng học phí gốc của khóa học đó.</p>
                    <p>- Khóa học được bảo lưu sẽ không thể chuyển khóa, không thể chuyển nhượng, và không hoàn lại học phí vì bất kì lý do nào. Do đó, trước khi nộp học phí, học viên được khuyến nghị cần sắp xếp thời gian học để theo đúng tiến độ của khóa học đã đăng ký.</p>
                    <p>- Quy định về thời hạn bảo lưu:</p>
                    <p>+ Học viên đã tham gia từ buổi 1 đến buổi 3 của khóa học, học viên phải nộp lệ phí bảo lưu là: 500.000 VNĐ (Năm trăm ngàn đồng/học viên/khóa).</p>
                    <p>+ Học viên đã tham gia từ buổi 4 đến buổi 7 của khóa học, học viên phải nộp lệ phí bảo lưu là: 1.000.000 VNĐ (Một triệu đồng/học viên/khóa).</p>
                    <p>+ Sau buổi thứ buổi 7 của khóa học, PTE Intensive sẽ không tiếp nhận bất kì trường hợp bảo lưu nào, học viên phải chủ động sắp xếp thời gian để tiếp tục khóa học đã đăng ký.</p>
                    
                    <h5 className="font-semibold mt-3">1.5. Chính sách hoàn trả học phí</h5>
                    <p>PTE Intensive luôn cam kết ưu tiên hàng đầu về chất lượng giảng dạy và hỗ trợ mọi điều kiện tốt nhất dành cho học viên. Tuy nhiên, nếu khi bắt đầu tham gia khóa học, vì một số nguyên nhân cá nhân, học viên không thể tiếp tục đồng hành cùng Trung Tâm, PTE Intensive sẽ hỗ trợ hoàn trả học phí, dựa trên các điều khoản cụ thể như sau:</p>
                    <p>1. Hoàn trả 100% tổng số tiền học phí trước khi khóa học bắt đầu.</p>
                    <p>2. Hoàn trả 40% tổng số tiền học phí đối với trường hợp học viên đã tham gia 02 tuần trong lộ trình của khóa học.</p>
                    <p>3. Sau 02 tuần của lộ trình khóa học, Trung Tâm sẽ không hoàn trả học phí trong mọi trường hợp (trừ các vấn đề phát sinh của Trung Tâm).</p>
                    
                    <h4 className="font-bold text-[#fc5d01] mt-4">B. CAM KẾT ĐẦU RA</h4>
                    
                    <h5 className="font-semibold mt-3">Quyền lợi của học viên:</h5>
                    <p>Chỉ xem xét trường hợp học viên có ý thức học tập tốt (tham gia buổi học đầy đủ, nộp bài đúng hạn, đảm bảo tuân thủ đúng lộ trình đã thiết kế) nhưng chưa đạt kết quả mục tiêu đầu ra:</p>
                    <p>- Hỗ trợ học viên để đạt kết quả tốt nhất tối đa trong 06 tháng.</p>
                    <p>- Dựa trên kết quả thi thực tế gần nhất của học viên, Trung Tâm sẽ xem xét duyệt cho học viên vào tham gia học miễn phí các khóa học kỹ năng chuyên sâu đối với kết quả kỹ năng chưa đạt điểm theo yêu cầu.</p>
                    <p>- Từ mục tiêu điểm PTE50 trở lên, học viên chưa đạt điểm PTE đầu ra cần đăng ký thi trong vòng 01 tháng kể từ khi kết thúc khóa học.</p>
                    
                    <h5 className="font-semibold mt-3">Trách nhiệm của Trung Tâm:</h5>
                    <p>Tất cả học viên do PTE Intensive đều được cam kết đảm bảo đầu ra, và Trung Tâm sẽ miễn trừ không cam kết đầu ra nếu học viên không vi phạm các trường hợp quy định như sau:</p>
                    <p>- Học viên vi phạm yêu trình đào tạo đã cam kết tại Mục A.</p>
                    <p>- Học sinh bị phát hiện có bất kỳ hành vi gian lận khi hoàn thành nộp bài tập về nhà, và các bài Mock Test (thi thử) do Giảng viên phụ trách khóa học yêu cầu.</p>
                    <p>- Học viên không phải là người thực hiện bài kiểm tra đầu vào do Trung Tâm yêu cầu.</p>
                  </div>
                  
                  <div className="mt-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 h-5 w-5 text-[#fc5d01] rounded border-gray-300 focus:ring-[#fc5d01]"
                        onChange={() => setTermsAccepted(!termsAccepted)}
                      />
                      <span className="text-gray-700">Tôi đã đọc, hiểu và đồng ý với Quy định đào tạo và Cam kết đầu ra của PTE Intensive</span>
                    </label>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => setTermsAccepted(true)}
                      className="w-full py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#fd7f33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
                    >
                      Tôi đã đọc và đồng ý
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-[#fc5d01] mb-4">Thông tin đăng ký</h3>
                <PublicStudentForm onSubmit={handleSubmit} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
